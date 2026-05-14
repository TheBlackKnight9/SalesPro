import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/shared.types";
export declare class QuotationController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    findById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    downloadPdf(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=quotation.controller.d.ts.map