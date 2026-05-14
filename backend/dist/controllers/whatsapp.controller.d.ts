import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types/shared.types";
export declare class WhatsappController {
    verifyWebhook(req: Request, res: Response, next: NextFunction): void;
    handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
    sendTemplate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=whatsapp.controller.d.ts.map