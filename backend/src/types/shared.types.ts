// ─────────────────────────────────────────────
// Shared Types for SalesPro CRM Backend
// ─────────────────────────────────────────────

import { UserRole } from "@prisma/client";
import { Request } from "express";

// ── JWT Payload ──────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  officeId: string | null;
}

// ── Authenticated Request ────────────────────
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ── API Response Envelope ────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ── Pagination Query ─────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── App Error ────────────────────────────────
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
