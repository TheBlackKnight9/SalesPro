import { JwtPayload } from "../types/shared.types";
import { CreateQuotationDto } from "../types/quotation.types";
export declare class QuotationService {
    create(dto: CreateQuotationDto, currentUser: JwtPayload): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            taxAmount: import("@prisma/client-runtime-utils").Decimal;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            quotationId: string;
            productId: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            unit: string;
            taxRate: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            discountPct: import("@prisma/client-runtime-utils").Decimal;
            sortOrder: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.QuotationStatus;
        notes: string | null;
        leadId: string | null;
        quotationNumber: string;
        customerId: string | null;
        validUntil: Date | null;
        termsConditions: string | null;
        subtotal: import("@prisma/client-runtime-utils").Decimal;
        discountAmount: import("@prisma/client-runtime-utils").Decimal;
        taxAmount: import("@prisma/client-runtime-utils").Decimal;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        sentAt: Date | null;
        acceptedAt: Date | null;
    }>;
    findById(id: string): Promise<{
        lead: {
            phone: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            company: string | null;
        } | null;
        customer: {
            phone: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            company: string | null;
        } | null;
        createdBy: {
            name: string;
            email: string;
        };
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            taxAmount: import("@prisma/client-runtime-utils").Decimal;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            quotationId: string;
            productId: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            unit: string;
            taxRate: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            discountPct: import("@prisma/client-runtime-utils").Decimal;
            sortOrder: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        status: import("@prisma/client").$Enums.QuotationStatus;
        notes: string | null;
        leadId: string | null;
        quotationNumber: string;
        customerId: string | null;
        validUntil: Date | null;
        termsConditions: string | null;
        subtotal: import("@prisma/client-runtime-utils").Decimal;
        discountAmount: import("@prisma/client-runtime-utils").Decimal;
        taxAmount: import("@prisma/client-runtime-utils").Decimal;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        sentAt: Date | null;
        acceptedAt: Date | null;
    }>;
    generatePdf(id: string): Promise<Buffer>;
}
//# sourceMappingURL=quotation.service.d.ts.map