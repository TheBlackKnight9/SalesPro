import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/shared.types";
export declare class LeadController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getKanban(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    findById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    assign(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    convert(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=lead.controller.d.ts.map