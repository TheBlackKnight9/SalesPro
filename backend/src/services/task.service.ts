import prisma from "../config/prisma";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { AppError, JwtPayload } from "../types/shared.types";

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  assigneeId?: string;
}

export class TaskService {
  async createTaskForLead(leadId: string, dto: CreateTaskDto, creator: JwtPayload) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new AppError("Lead not found.", 404);

    const task = await prisma.task.create({
      data: {
        leadId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority || "MEDIUM",
        assigneeId: dto.assigneeId || creator.userId,
        createdById: creator.userId,
        status: "PENDING",
      },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        leadId,
        performedById: creator.userId,
        type: "TASK_CREATED",
        title: "New Task Created",
        description: `Task "${dto.title}" assigned to ${dto.assigneeId === creator.userId ? 'self' : 'agent'}.`,
      }
    });

    return task;
  }

  async getTasksByLead(leadId: string) {
    return prisma.task.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      }
    });
  }
}
