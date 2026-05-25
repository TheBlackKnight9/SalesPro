import PDFDocument from "pdfkit";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError, JwtPayload, PaginationMeta } from "../types/shared.types";
import { CreateQuotationDto, UpdateQuotationDto } from "../types/quotation.types";

export class QuotationService {
  // ── Create Quotation ────────────────────────
  async create(dto: CreateQuotationDto, currentUser: JwtPayload) {
    if (!dto.leadId && !dto.customerId) {
      throw new AppError("Either leadId or customerId must be provided.", 400);
    }

    // Generate quotation number (e.g., QT-YYYYMMDD-XXXX)
    const count = await prisma.quotation.count();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const qNumber = `QT-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const itemsData = dto.items.map((item, index) => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      const lineTax = lineTotal * ((item.taxRate ?? 18) / 100);

      subtotal += lineTotal;
      taxAmount += lineTax;

      return {
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate ?? 18,
        taxAmount: lineTax,
        totalAmount: lineTotal + lineTax,
        sortOrder: index,
      };
    });

    const totalAmount = subtotal + taxAmount;

    return prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          quotationNumber: qNumber,
          leadId: dto.leadId,
          customerId: dto.customerId,
          createdById: currentUser.userId,
          organizationId: currentUser.organizationId,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          notes: dto.notes,
          termsConditions: dto.termsConditions,
          subtotal,
          taxAmount,
          totalAmount,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      // Business Logic: If this quotation is linked to a Lead, automatically upgrade that lead to "QUALIFIED"
      if (dto.leadId) {
        const lead = await tx.lead.findUnique({
          where: { id: dto.leadId },
          select: { status: true, isConverted: true }
        });

        // We only auto-qualify if the lead isn't already converted or lost
        if (lead && !lead.isConverted && lead.status !== "WON" && lead.status !== "LOST") {
          await tx.lead.update({
            where: { id: dto.leadId },
            data: { status: "QUALIFIED" }
          });

          // Add to activity timeline
          await tx.activity.create({
            data: {
              leadId: dto.leadId,
              performedById: currentUser.userId,
              type: "LEAD_STATUS_CHANGED",
              title: "Lead Qualified (Auto)",
              description: `Lead automatically marked as QUALIFIED due to quotation generation [${qNumber}].`,
            }
          });
        }
      }

      return quotation;
    });
  }

  // ── Get All Quotations (RBAC) ──────────────
  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      officeId?: string;
      status?: string;
    },
    currentUser: JwtPayload
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: currentUser.organizationId,
    };

    // RBAC Filtering: Super Admin Bypass
    if (currentUser.role === "SUPER_ADMIN") {
      console.log("[QuotationService] SUPER_ADMIN detected - No RBAC filters applied.");
      if (query.officeId) where.createdBy = { officeId: query.officeId };
    } else if (currentUser.role === "AGENT") {
      where.createdById = currentUser.userId;
    } else if (currentUser.role === "MANAGER") {
      if (!currentUser.officeId) {
        console.warn("[QuotationService] MANAGER has no officeId assigned - returning empty.");
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
      where.createdBy = { officeId: currentUser.officeId };
    }

    if (query.status) where.status = query.status;
    console.log("[QuotationService] Final Where Clause:", JSON.stringify(where, null, 2));
    if (query.search) {
      where.OR = [
        { quotationNumber: { contains: query.search, mode: "insensitive" } },
        { lead: { firstName: { contains: query.search, mode: "insensitive" } } },
        { customer: { firstName: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          lead: { select: { firstName: true, lastName: true, company: true } },
          customer: { select: { firstName: true, lastName: true, company: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    return {
      data: quotations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Update Quotation Status ──────────────────
  async updateStatus(id: string, status: any, currentUser: JwtPayload) {
    const quote = await this.findById(id);

    // RBAC: Agents can only update their own quotes
    if (currentUser.role === "AGENT" && quote.createdById !== currentUser.userId) {
      throw new AppError("Access denied to this quotation.", 403);
    }

    try {
      return await prisma.$transaction(async (tx) => {
        console.log(`[QuotationService] Step A: Updating Quote ${id} to ${status}`);
        // Step A: Update the Quotation status to ACCEPTED
        const updated = await tx.quotation.update({
          where: { id },
          data: { 
            status,
            acceptedAt: status === "ACCEPTED" ? new Date() : undefined,
          },
        });

        // Business Logic: If status changed to ACCEPTED, automatically trigger lead-to-customer conversion
        // Only run this logic if the status is actually changing TO ACCEPTED
        if (status === "ACCEPTED" && quote.status !== "ACCEPTED") {
          console.log(`[QuotationService] Status changing to ACCEPTED for Quote ${id}`);
          
          if (quote.leadId) {
            console.log(`[QuotationService] Processing Lead ${quote.leadId} for conversion`);
            // Fetch associated Lead and check for existing customer
            const lead = await tx.lead.findUnique({ 
              where: { id: quote.leadId },
              include: { customer: true }
            });

            if (lead) {
              let customerId = lead.customer?.id;

              if (!lead.customer) {
                console.log(`[QuotationService] Creating new Customer for Lead ${lead.id}`);
                
                // Revenue Aggregation: Calculate total revenue from all ACCEPTED quotes for this lead
                // Note: updated quote is already ACCEPTED in the DB at this point (Step A)
                const acceptedQuotes = await tx.quotation.findMany({
                  where: { leadId: lead.id, status: "ACCEPTED" }
                });
                const totalRevenue = acceptedQuotes.reduce((sum, q) => sum + Number(q.totalAmount), 0);

                const customer = await tx.customer.create({
                  data: {
                    leadId: lead.id,
                    officeId: lead.officeId,
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.email,
                    phone: lead.phone,
                    company: lead.company,
                    designation: lead.designation,
                    notes: lead.notes ? `${lead.notes}\n\n[Auto-Converted]: Quotation [${quote.quotationNumber}] accepted.` : `[Auto-Converted]: Quotation [${quote.quotationNumber}] accepted.`,
                    totalRevenue: new Prisma.Decimal(totalRevenue),
                  },
                });
                customerId = customer.id;

                // Link all ACCEPTED quotations for this lead to the new Customer
                await tx.quotation.updateMany({
                  where: { leadId: lead.id, status: "ACCEPTED" },
                  data: { customerId: customer.id }
                });

                // Set Lead status to WON and mark as converted
                await tx.lead.update({
                  where: { id: lead.id },
                  data: { isConverted: true, convertedAt: new Date(), status: "WON" },
                });

                // Log activity
                await tx.activity.create({
                  data: {
                    leadId: lead.id,
                    customerId: customer.id,
                    performedById: currentUser.userId,
                    type: "LEAD_CONVERTED",
                    title: "Lead Converted (Auto)",
                    description: `Converted automatically via Quotation [${quote.quotationNumber}] acceptance.`,
                  },
                });
              } else {
                console.log(`[QuotationService] Customer already exists for Lead ${lead.id}. Updating revenue.`);
                // Update existing customer revenue and link this quote
                await tx.customer.update({
                  where: { id: lead.customer.id },
                  data: { 
                    totalRevenue: { increment: Number(quote.totalAmount) }
                  }
                });
                
                await tx.quotation.update({
                  where: { id },
                  data: { customerId: lead.customer.id }
                });
              }
            }
          } else if (quote.customerId) {
            console.log(`[QuotationService] Updating revenue for existing Customer ${quote.customerId}`);
            await tx.customer.update({
              where: { id: quote.customerId },
              data: { 
                totalRevenue: { increment: Number(quote.totalAmount) }
              }
            });
          }
        }

        return updated;
      });
    } catch (err: any) {
      console.error("[QuotationService] Status Update Error:", err);
      // Log to a scratch file for debugging
      try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join('c:\\Internship\\setu CRM\\backend\\scratch', 'error_log.txt');
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] Quotation ${id} Update Error: ${err.message}\nStack: ${err.stack}\n\n`;
        fs.appendFileSync(logPath, logMessage);
      } catch (logErr) {
        console.error("Failed to log to scratch file", logErr);
      }
      
      if (err instanceof AppError) throw err;
      throw new AppError(err.message || "An error occurred during status update.", 500);
    }
  }

  // ── Get Single Quotation ────────────────────
  async findById(id: string, currentUser?: JwtPayload) {
    const quote = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        lead: { 
          select: { 
            id: true,
            officeId: true,
            firstName: true, 
            lastName: true, 
            company: true, 
            email: true, 
            phone: true,
            designation: true,
            notes: true,
            alternatePhone: true
          } 
        },
        customer: { select: { firstName: true, lastName: true, company: true, email: true, phone: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!quote) throw new AppError("Quotation not found.", 404);

    if (currentUser && quote.organizationId !== currentUser.organizationId) {
      throw new AppError("Access denied: This quotation belongs to another organization.", 403);
    }

    return quote;
  }

  // ── Generate PDF ────────────────────────────
  async generatePdf(id: string): Promise<Buffer> {
    const quote = await this.findById(id);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).text("QUOTATION", { align: "right" });
        doc.fontSize(10).text(`Quotation #: ${quote.quotationNumber}`, { align: "right" });
        doc.text(`Date: ${quote.createdAt.toLocaleDateString()}`, { align: "right" });
        
        if (quote.validUntil) {
          doc.text(`Valid Until: ${quote.validUntil.toLocaleDateString()}`, { align: "right" });
        }

        doc.moveDown(2);

        // Company Info (From)
        doc.fontSize(12).text("SalesPro CRM", { align: "left" });
        doc.fontSize(10).text("123 Business Street");
        doc.text("Tech City, 10001");
        
        // Client Info (To)
        doc.moveUp(3);
        const client = quote.customer || quote.lead;
        doc.fontSize(12).text("Bill To:", 300);
        doc.fontSize(10).text(`${client?.firstName} ${client?.lastName || ""}`, 300);
        if (client?.company) doc.text(client.company, 300);
        if (client?.email) doc.text(client.email, 300);
        if (client?.phone) doc.text(client.phone, 300);

        doc.moveDown(3);

        // Table Header
        const tableTop = doc.y;
        doc.font("Helvetica-Bold");
        doc.text("Description", 50, tableTop);
        doc.text("Qty", 280, tableTop);
        doc.text("Unit Price", 330, tableTop);
        doc.text("Tax", 400, tableTop);
        doc.text("Total", 480, tableTop, { width: 70, align: "right" });
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        doc.font("Helvetica");

        let y = tableTop + 25;

        // Items
        for (const item of quote.items) {
          doc.text(item.description, 50, y, { width: 220 });
          doc.text(Number(item.quantity).toString(), 280, y);
          doc.text(`$${Number(item.unitPrice).toFixed(2)}`, 330, y);
          doc.text(`${Number(item.taxRate)}%`, 400, y);
          doc.text(`$${Number(item.totalAmount).toFixed(2)}`, 480, y, { width: 70, align: "right" });
          
          y += 20;
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        }

        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 15;

        // Totals
        doc.font("Helvetica-Bold");
        doc.text("Subtotal:", 380, y);
        doc.text(`$${Number(quote.subtotal).toFixed(2)}`, 480, y, { width: 70, align: "right" });
        
        y += 20;
        doc.text("Tax:", 380, y);
        doc.text(`$${Number(quote.taxAmount).toFixed(2)}`, 480, y, { width: 70, align: "right" });

        y += 20;
        doc.fontSize(12);
        doc.text("Total:", 380, y);
        doc.text(`$${Number(quote.totalAmount).toFixed(2)}`, 480, y, { width: 70, align: "right" });

        // Notes & Terms
        if (quote.notes || quote.termsConditions) {
          doc.fontSize(10).font("Helvetica");
          y += 50;
          
          if (quote.notes) {
            doc.font("Helvetica-Bold").text("Notes:");
            doc.font("Helvetica").text(quote.notes);
            y = doc.y + 10;
          }

          if (quote.termsConditions) {
            doc.font("Helvetica-Bold").text("Terms & Conditions:", 50, y);
            doc.font("Helvetica").text(quote.termsConditions);
          }
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
