import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/shared.types";
export declare class AuthController {
    login(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map