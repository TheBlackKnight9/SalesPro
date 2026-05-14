import PDFDocument from "pdfkit";
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

    return prisma.quotation.create({
      data: {
        quotationNumber: qNumber,
        leadId: dto.leadId,
        customerId: dto.customerId,
        createdById: currentUser.userId,
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
  }

  // ── Get Single Quotation ────────────────────
  async findById(id: string) {
    const quote = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        lead: { select: { firstName: true, lastName: true, company: true, email: true, phone: true } },
        customer: { select: { firstName: true, lastName: true, company: true, email: true, phone: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!quote) throw new AppError("Quotation not found.", 404);
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
