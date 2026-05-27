import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { AppError } from "../types/shared.types";
import { LoginDto, LoginResponse, SignupDto, UpdateProfileDto, RegisterOrganizationDto } from "../types/auth.types";
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
        password: passwordHash,
        phone,
        role,
        officeId: resolvedOfficeId,
        organizationId: dto.organizationId || null,
        isActive: true, // Default to active
      },
      include: {
        organization: { select: { name: true, logoUrl: true } }
      }
    });

    // 5. Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        officeId: user.officeId,
        organizationId: user.organizationId,
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
        organizationId: user.organizationId,
        organizationName: (user as any).organization?.name || "Unified Workspace",
        organizationLogo: (user as any).organization?.logoUrl || null,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ── Register Organization (Public Signup) ────
  async registerOrganization(dto: RegisterOrganizationDto): Promise<LoginResponse> {
    const { companyName, ownerName, email, password, phone } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new AppError("Email is already registered.", 400);
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 3. Execute inside a transaction context
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create the isolated corporate workspace
      const newOrg = await tx.organization.create({
        data: {
          name: companyName, // e.g., "Pratik's Agency"
        },
      });

      // Step 2: Create the owner profile explicitly tied to the new workspace
      const newUser = await tx.user.create({
        data: {
          name: ownerName,
          email: email.toLowerCase().trim(),
          password: passwordHash, // Ensure bcrypt/argon2 hashing runs before this
          role: 'SUPER_ADMIN',      // Explicitly set their role as the global account owner
          organizationId: newOrg.id, // Tie them directly to their brand-new isolated workspace
        },
      });

      return { newOrg, newUser };
    });

    // 4. Generate token with organizationId
    const token = jwt.sign(
      {
        userId: result.newUser.id,
        email: result.newUser.email,
        role: result.newUser.role,
        officeId: result.newUser.officeId,
        organizationId: result.newUser.organizationId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    return {
      token,
      user: {
        id: result.newUser.id,
        name: result.newUser.name,
        email: result.newUser.email,
        role: result.newUser.role as any,
        officeId: result.newUser.officeId,
        organizationId: result.newUser.organizationId,
        organizationName: result.newOrg.name,
        organizationLogo: result.newOrg.logoUrl || null,
        avatarUrl: result.newUser.avatarUrl,
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
        organizationId: true,
        avatarUrl: true,
        password: true,
        isActive: true,
        organization: { select: { name: true, logoUrl: true } },
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    if (!user.isActive) {
      throw new AppError("Your account has been deactivated. Contact admin.", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
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
        organizationId: user.organizationId,
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
        organizationId: user.organizationId,
        organizationName: user.organization?.name || "Unified Workspace",
        organizationLogo: user.organization?.logoUrl || null,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ── Update Profile ──────────────────────────
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, organizationId: true },
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

    if (currentUser.role === "SUPER_ADMIN" && currentUser.organizationId) {
      if (dto.organizationName !== undefined || dto.organizationLogo !== undefined) {
        await prisma.organization.update({
          where: { id: currentUser.organizationId },
          data: {
            ...(dto.organizationName !== undefined && { name: dto.organizationName.trim() }),
            ...(dto.organizationLogo !== undefined && { logoUrl: dto.organizationLogo || null }),
          },
        });
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
        organizationId: true,
        organization: { select: { name: true, logoUrl: true } },
      },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      officeId: updatedUser.officeId,
      avatarUrl: updatedUser.avatarUrl,
      organizationId: updatedUser.organizationId,
      organizationName: updatedUser.organization?.name || "Unified Workspace",
      organizationLogo: updatedUser.organization?.logoUrl || null,
    };
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
        organization: {
          select: { id: true, name: true, logoUrl: true }
        }
      },
    });

    if (!user) throw new AppError("User not found.", 404);
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      office: user.office,
      organizationId: user.organization?.id || null,
      organizationName: user.organization?.name || "Unified Workspace",
      organizationLogo: user.organization?.logoUrl || null,
    };
  }

  // ── Change Password ────────────────────────
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) throw new AppError("User not found.", 404);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new AppError("Current password is incorrect.", 400);

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHash },
    });
  }

  // ── Hash Password (static utility) ────────
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
