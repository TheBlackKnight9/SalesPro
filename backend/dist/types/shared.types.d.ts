import { UserRole } from "@prisma/client";
import { Request } from "express";
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    officeId: string;
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
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
export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
//# sourceMappingURL=shared.types.d.ts.map