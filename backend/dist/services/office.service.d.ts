import { PaginationMeta } from "../types/shared.types";
import { CreateOfficeDto, UpdateOfficeDto } from "../types/office.types";
export declare class OfficeService {
    create(dto: CreateOfficeDto): Promise<{
        name: string;
        id: string;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string;
        phone: string | null;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: object[];
        meta: PaginationMeta;
    }>;
    findById(id: string): Promise<{
        _count: {
            users: number;
            leads: number;
            customers: number;
        };
    } & {
        name: string;
        id: string;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string;
        phone: string | null;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateOfficeDto): Promise<{
        name: string;
        id: string;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string;
        phone: string | null;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=office.service.d.ts.map