import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/shared.types";
export declare class UserController {
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    findById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    deactivate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    findByOffice(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=user.controller.d.ts.map