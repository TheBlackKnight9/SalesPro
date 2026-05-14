import { QuotationStatus } from "@prisma/client";
export interface CreateQuotationItemDto {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
}
export interface CreateQuotationDto {
    leadId?: string;
    customerId?: string;
    validUntil?: string;
    notes?: string;
    termsConditions?: string;
    items: CreateQuotationItemDto[];
}
export interface UpdateQuotationDto {
    status?: QuotationStatus;
    validUntil?: string;
    notes?: string;
    termsConditions?: string;
}
//# sourceMappingURL=quotation.types.d.ts.map