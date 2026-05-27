// ─────────────────────────────────────────────
// Auth DTOs
// ─────────────────────────────────────────────

import { UserRole } from "@prisma/client";

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface SignupDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  officeId?: string;
  organizationId?: string;
}

export interface RegisterOrganizationDto {
  companyName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    officeId: string | null;
    organizationId: string | null;
    organizationName?: string | null;
    avatarUrl: string | null;
  };
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  organizationName?: string;
}
