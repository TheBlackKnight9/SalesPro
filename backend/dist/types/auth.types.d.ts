export interface LoginDto {
    email: string;
    password: string;
}
export interface LoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        officeId: string;
        avatarUrl: string | null;
    };
}
export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
//# sourceMappingURL=auth.types.d.ts.map