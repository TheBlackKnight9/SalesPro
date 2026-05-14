// ─────────────────────────────────────────────
// User DTOs
// ─────────────────────────────────────────────

import { UserRole } from "@prisma/client";

export interface CreateUserDto {
  officeId: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
  avatarUrl?: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  role?: UserRole;
  avatarUrl?: string;
  isActive?: boolean;
  officeId?: string;
}
