import { LoginDto, LoginResponse } from "../types/auth.types";
export declare class AuthService {
    login(dto: LoginDto): Promise<LoginResponse>;
    getProfile(userId: string): Promise<{
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
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    static hashPassword(password: string): Promise<string>;
}
//# sourceMappingURL=auth.service.d.ts.map