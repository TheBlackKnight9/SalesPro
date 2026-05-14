import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/shared.types";
export declare class OfficeController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    findById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=office.controller.d.ts.map