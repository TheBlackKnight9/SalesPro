import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError, AuthRequest, JwtPayload } from "../types/shared.types";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-prod";

// ── Verify JWT Token ─────────────────────────
export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided. Access denied.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded?.userId || !decoded?.email || !decoded?.role) {
      return next(new AppError("Invalid token payload.", 401));
    }

    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.AGENT];
    if (!allowedRoles.includes(decoded.role)) {
      return next(new AppError("Invalid token role.", 401));
    }

    req.user = decoded;
    next();
  } catch {
    next(new AppError("Invalid or expired token.", 401));
  }
};

// ── Role Guard Factory ───────────────────────
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Not authenticated.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(" or ")}`,
          403
        )
      );
    }

    next();
  };
};
