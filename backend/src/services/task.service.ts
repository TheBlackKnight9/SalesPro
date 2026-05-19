import prisma from "../config/prisma";
import { TaskStatus, TaskPriority, ActivityType } from "@prisma/client";
import { AppError, JwtPayload } from "../types/shared.types";

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  assignedToId?: string;
  linkedLeadId?: string;
  linkedCustomerId?: string;
}

export class TaskService {
  // ── Create Task ─────────────────────────────
  async create(dto: CreateTaskDto, creator: JwtPayload) {
    const task = await prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority || "MEDIUM",
        assignedToId: dto.assignedToId || creator.userId,
        createdById: creator.userId,
        linkedLeadId: dto.linkedLeadId,
        linkedCustomerId: dto.linkedCustomerId,
        status: "PENDING",
      },
      include: {
        assignedTo: { select: { name: true } },
        linkedLead: { select: { firstName: true, lastName: true } },
        linkedCustomer: { select: { firstName: true, lastName: true } },
      }
    });

    // Log Activity if linked to Lead
    if (dto.linkedLeadId) {
      await prisma.activity.create({
        data: {
          leadId: dto.linkedLeadId,
          performedById: creator.userId,
          type: ActivityType.TASK_CREATED,
          title: "Task Created",
          description: `New task assigned: ${dto.title}`,
        }
      });
    }

    return task;
  }

  // ── Get All Tasks (RBAC) ────────────────────
  async findAll(currentUser: JwtPayload) {
    const where: any = {};

    // RBAC Filtering
    if (currentUser.role === "AGENT") {
      where.assignedToId = currentUser.userId;
    } else if (currentUser.role === "MANAGER") {
      // Manager sees tasks assigned to users in their office
      where.assignedTo = { officeId: currentUser.officeId };
    }
    // SUPER_ADMIN sees all (where remains {})

    return prisma.task.findMany({
      where,
      orderBy: [
        { status: "asc" }, // Show Pending first
        { dueDate: "asc" }
      ],
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true, role: true } },
        linkedLead: { select: { id: true, firstName: true, lastName: true } },
        linkedCustomer: { select: { id: true, firstName: true, lastName: true } },
      }
    });
  }

  // ── Update Task Status ──────────────────────
  async updateStatus(id: string, status: TaskStatus, currentUser: JwtPayload) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new AppError("Task not found.", 404);

    // Permission Check: Agents can only update their own tasks
    if (currentUser.role === "AGENT" && task.assignedToId !== currentUser.userId) {
      throw new AppError("Permission denied: You can only update tasks assigned to you.", 403);
    }

    return prisma.task.update({
      where: { id },
      data: { 
        status,
        completedAt: status === "COMPLETED" ? new Date() : null
      }
    });
  }

  // ── Delete Task ─────────────────────────────
  async delete(id: string, currentUser: JwtPayload) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new AppError("Task not found.", 404);

    // Permission Check: Agents can only delete their own tasks
    if (currentUser.role === "AGENT" && task.assignedToId !== currentUser.userId) {
      throw new AppError("Permission denied: You can only delete tasks assigned to you.", 403);
    }

    // Permission Check: Managers can only delete tasks assigned to users in their office
    if (currentUser.role === "MANAGER" && task.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: task.assignedToId },
        select: { officeId: true }
      });
      if (assignee?.officeId !== currentUser.officeId) {
        throw new AppError("Permission denied: You can only delete tasks for users in your office.", 403);
      }
    }

    return prisma.task.delete({ where: { id } });
  }
}

