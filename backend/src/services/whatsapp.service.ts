import axios from "axios";
import prisma from "../config/prisma";
import { AppError } from "../types/shared.types";
import { SendTemplateDto, WebhookBodyPayload } from "../types/whatsapp.types";
import { WhatsAppMessageDirection, WhatsAppMessageStatus } from "@prisma/client";

const WA_TOKEN = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export class WhatsappService {
  // ── Send Template Message (Outbound) ────────
  async sendTemplateMessage(dto: SendTemplateDto, senderId?: string) {
    if (!WA_TOKEN || !WA_PHONE_ID) {
      throw new AppError("WhatsApp integration is not configured.", 500);
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

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      const messageData = response.data.messages?.[0];
      const waMessageId = messageData?.id;

      // Save to database
      const savedMessage = await prisma.whatsAppMessage.create({
        data: {
          leadId: dto.leadId,
          customerId: dto.customerId,
          senderId: senderId,
          waMessageId,
          direction: WhatsAppMessageDirection.OUTBOUND,
          status: WhatsAppMessageStatus.SENT,
          fromPhone: WA_PHONE_ID, // Represents the sender's phone ID
          toPhone: dto.toPhone,
          templateName: dto.templateName,
          body: `[Template Message: ${dto.templateName}]`,
        },
      });

      return savedMessage;
    } catch (error: any) {
      console.error("WhatsApp API Error:", error.response?.data || error.message);
      
      await prisma.whatsAppMessage.create({
        data: {
          leadId: dto.leadId,
          customerId: dto.customerId,
          senderId: senderId,
          direction: WhatsAppMessageDirection.OUTBOUND,
          status: WhatsAppMessageStatus.FAILED,
          fromPhone: WA_PHONE_ID,
          toPhone: dto.toPhone,
          templateName: dto.templateName,
          body: `[Template Message: ${dto.templateName}]`,
          errorMessage: error.response?.data?.error?.message || error.message,
        },
      });

      throw new AppError("Failed to send WhatsApp message.", 500);
    }
  }

  // ── Process Webhook (Inbound) ───────────────
  async processWebhook(body: WebhookBodyPayload) {
    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Process message status updates (Delivered, Read)
        if (value.statuses) {
          for (const status of value.statuses) {
            await prisma.whatsAppMessage.updateMany({
              where: { waMessageId: status.id },
              data: {
                status: status.status.toUpperCase() as WhatsAppMessageStatus,
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
            const exists = await prisma.whatsAppMessage.findUnique({
              where: { waMessageId },
            });
            if (exists) continue;

            const fromPhone = message.from;
            const bodyText = message.text?.body || `[Media Message: ${message.type}]`;
            
            // Match with Lead or Customer by phone number (basic matching)
            const lead = await prisma.lead.findFirst({
              where: { phone: { contains: fromPhone } },
              orderBy: { createdAt: "desc" },
            });

            const customer = await prisma.customer.findFirst({
              where: { phone: { contains: fromPhone } },
            });

            await prisma.whatsAppMessage.create({
              data: {
                waMessageId,
                direction: WhatsAppMessageDirection.INBOUND,
                status: WhatsAppMessageStatus.DELIVERED,
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
              await prisma.activity.create({
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
