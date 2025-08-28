import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './profile.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class ProfileController {
    private readonly service;
    constructor(service: ProfileService);
    viewMePage(user: AuthUser): Promise<{
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
    viewPublicPage(me: AuthUser, id: number): Promise<{
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
    userPreview(me: AuthUser, id: number): Promise<{
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
    me(user: AuthUser): Promise<{
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
    view(user: AuthUser, id: number): Promise<{
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
    update(user: AuthUser, dto: UpdateProfileDto): Promise<{
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
    uploadAvatar(user: AuthUser, file: Express.Multer.File): Promise<{
        ok: boolean;
        avatarUrl: string;
    }>;
    touch(user: AuthUser): Promise<{
        ok: boolean;
    }>;
}
