// ─────────────────────────────────────────────
// Lead DTOs
// ─────────────────────────────────────────────

import { LeadSource, LeadStatus, TaskPriority } from "@prisma/client";

export interface CreateLeadDto {
  officeId: string;
  managerId?: string;
  agentId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  company?: string;
  designation?: string;
  source?: LeadSource;
  status?: LeadStatus;
  priority?: TaskPriority;
  tags?: string[];
  notes?: string;
  budget?: number;
  expectedClosing?: string; // ISO date string
}

export interface UpdateLeadDto {
  managerId?: string;
  agentId?: string;
  assignedToId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  company?: string;
  designation?: string;
  source?: LeadSource;
  priority?: TaskPriority;
  tags?: string[];
  notes?: string;
  budget?: number;
  expectedClosing?: string;
}

export interface UpdateLeadStatusDto {
  status: LeadStatus;
  notes?: string;
}

export interface AssignLeadDto {
  agentId: string;
  notes?: string;
}

export interface LeadFilterQuery {
  officeId?: string;
  agentId?: string;
  managerId?: string;
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
