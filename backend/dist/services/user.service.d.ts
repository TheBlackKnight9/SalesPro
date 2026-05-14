import { PaginationMeta } from "../types/shared.types";
import { CreateUserDto, UpdateUserDto } from "../types/user.types";
import { UserRole } from "@prisma/client";
export declare class UserService {
    create(dto: CreateUserDto): Promise<{
        name: string;
        id: string;
        phone: string | null;
        email: string;
        isActive: boolean;
        createdAt: Date;
        officeId: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
    }>;
    findAll(page?: number, limit?: number, search?: string, officeId?: string, role?: UserRole): Promise<{
        data: object[];
        meta: PaginationMeta;
    }>;
    findById(id: string): Promise<{
        name: string;
        office: {
            name: string;
            id: string;
            city: string | null;
        };
        id: string;
        phone: string | null;
        email: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
        _count: {
            managedLeads: number;
            assignedLeads: number;
            tasks: number;
            followUps: number;
        };
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        name: string;
        id: string;
        phone: string | null;
        email: string;
        isActive: boolean;
        updatedAt: Date;
        officeId: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
    }>;
    deactivate(id: string): Promise<{
        name: string;
        id: string;
        phone: string | null;
        email: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        officeId: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
    }>;
    findByOffice(officeId: string): Promise<{
        name: string;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
    }[]>;
}
//# sourceMappingURL=user.service.d.ts.map