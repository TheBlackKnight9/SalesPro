import { SendTemplateDto, WebhookBodyPayload } from "../types/whatsapp.types";
export declare class WhatsappService {
    sendTemplateMessage(dto: SendTemplateDto, senderId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.WhatsAppMessageStatus;
        leadId: string | null;
        customerId: string | null;
        body: string;
        readAt: Date | null;
        senderId: string | null;
        waMessageId: string | null;
        direction: import("@prisma/client").$Enums.WhatsAppMessageDirection;
        fromPhone: string;
        toPhone: string;
        templateName: string | null;
        mediaUrl: string | null;
        mediaType: string | null;
        errorCode: string | null;
        errorMessage: string | null;
        deliveredAt: Date | null;
    }>;
    processWebhook(body: WebhookBodyPayload): Promise<void>;
}
//# sourceMappingURL=whatsapp.service.d.ts.map