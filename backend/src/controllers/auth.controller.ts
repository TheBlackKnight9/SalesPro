import { Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthRequest } from "../types/shared.types";
import { AppError } from "../types/shared.types";
import { UserRole } from "@prisma/client";

const authService = new AuthService();

export class AuthController {
  // POST /api/auth/signup
  async signup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { companyName, ownerName, name, email, password, phone, role } = req.body;

      // Staff Guardrails: block public signup of MANAGER and AGENT
      if (role === "AGENT" || role === "MANAGER") {
        throw new AppError(
          "Public registration is restricted to new organizations only. AGENT and MANAGER accounts must be onboarded by their administrator.",
          403
        );
      }

      const finalOwnerName = ownerName || name;
      const finalCompanyName = companyName || (finalOwnerName ? `${finalOwnerName}'s Company` : undefined);

      if (!finalOwnerName || !email || !password || !finalCompanyName) {
        throw new AppError("companyName, ownerName, email, and password are required.", 400);
      }

      const result = await authService.registerOrganization({
        companyName: finalCompanyName,
        ownerName: finalOwnerName,
        email,
        password,
        phone,
      });

      res.status(201).json({
        success: true,
        message: "Organization and administrator account created successfully.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/auth/login
  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { identifier, email, phone, password } = req.body;
      const loginIdentifier = identifier || email || phone;

      if (!loginIdentifier || !password) {
        throw new AppError("Email/mobile and password are required.", 400);
      }

      const result = await authService.login({ identifier: loginIdentifier, password });

      res.status(200).json({
        success: true,
        message: "Login successful.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/auth/profile
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const profile = await authService.getProfile(req.user.userId);

      res.status(200).json({
        success: true,
        message: "Profile fetched.",
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/auth/change-password
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError("currentPassword and newPassword are required.", 400);
      }

      if (newPassword.length < 8) {
        throw new AppError("New password must be at least 8 characters.", 400);
      }

      await authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: "Password changed successfully.",
      });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/auth/profile
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const result = await authService.updateProfile(req.user.userId, req.body);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
