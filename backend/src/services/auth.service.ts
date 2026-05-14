import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { AppError } from "../types/shared.types";
import { LoginDto, LoginResponse, SignupDto, UpdateProfileDto } from "../types/auth.types";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export class AuthService {
  // ── Signup ─────────────────────────────────
  async signup(dto: SignupDto): Promise<LoginResponse> {
    const { name, email, password, phone, role, officeId } = dto;
    const normalizedEmail = email.toLowerCase().trim();
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.AGENT];

    if (!allowedRoles.includes(role)) {
      throw new AppError("Invalid role. Allowed roles: SUPER_ADMIN, MANAGER, AGENT.", 400);
    }

    // 1. Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new AppError("Email is already registered.", 400);
    }

    // 2. Resolve and validate office assignment
    let resolvedOfficeId: string | null = officeId?.trim() || null;

    if ((role === UserRole.MANAGER || role === UserRole.AGENT) && !resolvedOfficeId) {
      throw new AppError("officeId is required for MANAGER and AGENT roles.", 400);
    }

    if (resolvedOfficeId) {
      const office = await prisma.office.findUnique({ where: { id: resolvedOfficeId } });
      if (!office) {
        throw new AppError("The provided Office ID is invalid.", 400);
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      // Current schema requires every user to belong to an office except potentially SUPER_ADMIN.
      const fallbackOffice = await prisma.office.findFirst({
        where: { isActive: true },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });

      if (!fallbackOffice) {
        throw new AppError(
          "No active office found. Create an office first or provide officeId.",
          400
        );
      }

      resolvedOfficeId = fallbackOffice.id;
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        phone,
        role,
        officeId: resolvedOfficeId,
        isActive: true, // Default to active
      },
    });

    // 5. Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        officeId: user.officeId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        officeId: user.officeId,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ── Login ──────────────────────────────────
  async login(dto: LoginDto): Promise<LoginResponse> {
    const { identifier, password } = dto;
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const isEmail = normalizedIdentifier.includes("@");

    const user = await prisma.user.findUnique({
      where: isEmail
        ? { email: normalizedIdentifier }
        : { phone: normalizedIdentifier },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        officeId: true,
        avatarUrl: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    if (!user.isActive) {
      throw new AppError("Your account has been deactivated. Contact admin.", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password.", 401);
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        officeId: user.officeId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        officeId: user.officeId,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ── Update Profile ──────────────────────────
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!currentUser) throw new AppError("User not found.", 404);

    if (dto.email && dto.email.toLowerCase().trim() !== currentUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });

      if (emailExists && emailExists.id !== userId) {
        throw new AppError("Email is already registered.", 400);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.email && { email: dto.email.toLowerCase().trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() || null }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        officeId: true,
        avatarUrl: true,
      },
    });

    return updatedUser;
  }

  // ── Get Profile ────────────────────────────
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        office: {
          select: { id: true, name: true, city: true },
        },
      },
    });

    if (!user) throw new AppError("User not found.", 404);
    return user;
  }

  // ── Change Password ────────────────────────
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) throw new AppError("User not found.", 404);

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError("Current password is incorrect.", 400);

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  // ── Hash Password (static utility) ────────
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
