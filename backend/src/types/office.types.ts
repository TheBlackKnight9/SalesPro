// ─────────────────────────────────────────────
// Office DTOs
// ─────────────────────────────────────────────

export interface CreateOfficeDto {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  monthlyTarget?: number;
}

export interface UpdateOfficeDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  monthlyTarget?: number;
}
