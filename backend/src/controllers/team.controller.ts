import { Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma";
import { AuthRequest, AppError } from "../types/shared.types";
import { UserRole } from "@prisma/client";

export class TeamController {
  // POST /api/team/create
  async createStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, temporaryPassword, role, officeId, phone } = req.body;
      const currentUser = req.user!;

      // 1. Validate required payload parameters
      if (!name || !email || !temporaryPassword || !role) {
        throw new AppError("name, email, temporaryPassword, and role are required.", 400);
      }

      const allowedRoles = [UserRole.MANAGER, UserRole.AGENT];
      if (!allowedRoles.includes(role)) {
        throw new AppError("Invalid role. Allowed roles for staff are MANAGER and AGENT.", 400);
      }

      // 2. Resolve and validate Office
      let finalOfficeId = officeId || null;

      if (currentUser.role === UserRole.MANAGER) {
        // Managers can only onboard Agents in their own office
        if (finalOfficeId && finalOfficeId !== currentUser.officeId) {
          throw new AppError("You can only onboard users for your own office.", 403);
        }
        if (role !== UserRole.AGENT) {
          throw new AppError("Managers can only onboard Agent accounts.", 403);
        }
        finalOfficeId = currentUser.officeId;
      }

      // If no officeId is specified and it is SUPER_ADMIN, try to resolve the first office of the system or let it be null
      if (!finalOfficeId && currentUser.role === UserRole.SUPER_ADMIN) {
        const firstOffice = await prisma.office.findFirst({
          where: { isActive: true },
          select: { id: true },
        });
        if (firstOffice) {
          finalOfficeId = firstOffice.id;
        }
      }

      if (!finalOfficeId) {
        throw new AppError("An office assignment is required to onboard staff.", 400);
      }

      // 3. Check if email is already registered
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        throw new AppError("Email is already registered.", 400);
      }

      // 4. Hash temporary password
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);

      // 5. Create user and inject organizationId automatically
      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: passwordHash,
          phone: phone || null,
          role,
          officeId: finalOfficeId,
          organizationId: currentUser.organizationId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          officeId: true,
          organizationId: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Staff member onboarded successfully.",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
}
