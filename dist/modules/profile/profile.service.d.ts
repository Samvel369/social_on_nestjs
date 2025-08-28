import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './profile.dto';
export declare class ProfileService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMyProfile(userId: number): Promise<{
        user: {
            username: string;
            email: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        };
        fullAccess: boolean;
        view: "self";
    }>;
    viewProfile(me: number, targetId: number): Promise<{
        user: {
            username: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        };
        fullAccess: boolean;
        view: "self";
    } | {
        user: {
            username: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        };
        fullAccess: boolean;
        view: "public" | "preview";
    }>;
    updateProfile(userId: number, dto: UpdateProfileDto): Promise<{
        ok: boolean;
        user: {
            username: string;
            email: string;
            birthdate: Date | null;
            id: number;
            avatarUrl: string;
            status: string;
            about: string;
        };
    }>;
    updateAvatar(userId: number, file: Express.Multer.File): Promise<{
        ok: boolean;
        avatarUrl: string;
    }>;
    touch(userId: number): Promise<{
        ok: boolean;
    }>;
}
