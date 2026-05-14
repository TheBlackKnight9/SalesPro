import { Request, Response, NextFunction } from "express";
import { WhatsappService } from "../services/whatsapp.service";
import { AppError, AuthRequest } from "../types/shared.types";

const whatsappService = new WhatsappService();
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "salespro_webhook_secret";

export class WhatsappController {
  // GET /api/whatsapp/webhook (Meta Verification)
  verifyWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
          console.log("WEBHOOK_VERIFIED");
          res.status(200).send(challenge);
          return;
        } else {
          res.sendStatus(403);
          return;
        }
      }
      res.sendStatus(400);
    } catch (err) { next(err); }
  }

  // POST /api/whatsapp/webhook (Incoming Messages)
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Return 200 OK immediately to Meta to prevent retries
      res.sendStatus(200);

      // Process asynchronously
      await whatsappService.processWebhook(req.body);
    } catch (err) { 
      console.error("Webhook processing error:", err);
    }
  }

  // POST /api/whatsapp/send-template
  async sendTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const { toPhone, templateName, languageCode, components, leadId, customerId } = req.body;
      
      if (!toPhone || !templateName) {
        throw new AppError("toPhone and templateName are required.", 400);
      }

      const result = await whatsappService.sendTemplateMessage({
        toPhone,
        templateName,
        languageCode,
        components,
        leadId,
        customerId
      }, req.user.userId);

      res.status(200).json({ success: true, message: "Template message sent.", data: result });
    } catch (err) { next(err); }
  }
}
