import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/shared.types";
import { UserRole } from "@prisma/client";
export declare const authenticate: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const authorize: (...roles: UserRole[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map