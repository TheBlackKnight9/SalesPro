import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/shared.types";

// ── Global Error Handler ─────────────────────
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Operational errors (AppError): send structured response
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    
    });
    return;
  }

  // Prisma known request errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as { code?: string; meta?: { target?: string[] } };

    if (prismaErr.code === "P2002") {
      const field = prismaErr.meta?.target?.[0] ?? "field";
      res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists.`,
      });
      return;
    }

    if (prismaErr.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Record not found.",
      });
      return;
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({ success: false, message: "Invalid token." });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({ success: false, message: "Token has expired." });
    return;
  }

  // Unknown / unexpected errors
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : err.message,
  });
};

// ── 404 Handler ──────────────────────────────
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
