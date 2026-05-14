"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../config/prisma"));
const shared_types_1 = require("../types/shared.types");
const client_1 = require("@prisma/client");
const WA_TOKEN = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
class WhatsappService {
    // ── Send Template Message (Outbound) ────────
    async sendTemplateMessage(dto, senderId) {
        if (!WA_TOKEN || !WA_PHONE_ID) {
            throw new shared_types_1.AppError("WhatsApp integration is not configured.", 500);
        }
        try {
            const url = `https://graph.facebook.com/v17.0/${WA_PHONE_ID}/messages`;
            const payload = {
                messaging_product: "whatsapp",
                to: dto.toPhone,
                type: "template",
                template: {
                    name: dto.templateName,
                    language: {
                        code: dto.languageCode ?? "en",
                    },
                    components: dto.components ?? [],
                },
            };
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${WA_TOKEN}`,
                    "Content-Type": "application/json",
                },
            });
            const messageData = response.data.messages?.[0];
            const waMessageId = messageData?.id;
            // Save to database
            const savedMessage = await prisma_1.default.whatsAppMessage.create({
                data: {
                    leadId: dto.leadId,
                    customerId: dto.customerId,
                    senderId: senderId,
                    waMessageId,
                    direction: client_1.WhatsAppMessageDirection.OUTBOUND,
                    status: client_1.WhatsAppMessageStatus.SENT,
                    fromPhone: WA_PHONE_ID, // Represents the sender's phone ID
                    toPhone: dto.toPhone,
                    templateName: dto.templateName,
                    body: `[Template Message: ${dto.templateName}]`,
                },
            });
            return savedMessage;
        }
        catch (error) {
            console.error("WhatsApp API Error:", error.response?.data || error.message);
            await prisma_1.default.whatsAppMessage.create({
                data: {
                    leadId: dto.leadId,
                    customerId: dto.customerId,
                    senderId: senderId,
                    direction: client_1.WhatsAppMessageDirection.OUTBOUND,
                    status: client_1.WhatsAppMessageStatus.FAILED,
                    fromPhone: WA_PHONE_ID,
                    toPhone: dto.toPhone,
                    templateName: dto.templateName,
                    body: `[Template Message: ${dto.templateName}]`,
                    errorMessage: error.response?.data?.error?.message || error.message,
                },
            });
            throw new shared_types_1.AppError("Failed to send WhatsApp message.", 500);
        }
    }
    // ── Process Webhook (Inbound) ───────────────
    async processWebhook(body) {
        if (body.object !== "whatsapp_business_account")
            return;
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                const value = change.value;
                // Process message status updates (Delivered, Read)
                if (value.statuses) {
                    for (const status of value.statuses) {
                        await prisma_1.default.whatsAppMessage.updateMany({
                            where: { waMessageId: status.id },
                            data: {
                                status: status.status.toUpperCase(),
                                ...(status.status === "delivered" && { deliveredAt: new Date(parseInt(status.timestamp) * 1000) }),
                                ...(status.status === "read" && { readAt: new Date(parseInt(status.timestamp) * 1000) }),
                            },
                        });
                    }
                }
                // Process incoming text/media messages
                if (value.messages) {
                    const phoneNumberId = value.metadata.phone_number_id;
                    for (const message of value.messages) {
                        const waMessageId = message.id;
                        // Check if message is already processed
                        const exists = await prisma_1.default.whatsAppMessage.findUnique({
                            where: { waMessageId },
                        });
                        if (exists)
                            continue;
                        const fromPhone = message.from;
                        const bodyText = message.text?.body || `[Media Message: ${message.type}]`;
                        // Match with Lead or Customer by phone number (basic matching)
                        const lead = await prisma_1.default.lead.findFirst({
                            where: { phone: { contains: fromPhone } },
                            orderBy: { createdAt: "desc" },
                        });
                        const customer = await prisma_1.default.customer.findFirst({
                            where: { phone: { contains: fromPhone } },
                        });
                        await prisma_1.default.whatsAppMessage.create({
                            data: {
                                waMessageId,
                                direction: client_1.WhatsAppMessageDirection.INBOUND,
                                status: client_1.WhatsAppMessageStatus.DELIVERED,
                                fromPhone,
                                toPhone: phoneNumberId,
                                body: bodyText,
                                mediaType: message.type,
                                leadId: lead?.id,
                                customerId: customer?.id,
                            },
                        });
                        // Log activity
                        if (lead) {
                            await prisma_1.default.activity.create({
                                data: {
                                    leadId: lead.id,
                                    performedById: lead.createdById, // Fallback if no specific user
                                    type: "WHATSAPP_RECEIVED",
                                    title: "WhatsApp Message Received",
                                    description: `Received: ${bodyText.substring(0, 50)}...`,
                                },
                            });
                        }
                    }
                }
            }
        }
    }
}
exports.WhatsappService = WhatsappService;
//# sourceMappingURL=whatsapp.service.js.map