import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './profile.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class ProfileController {
    private readonly service;
    constructor(service: ProfileService);
    view(user: AuthUser): Promise<{
        current_user: {
            id: number;
            userId: number;
            username: string;
            avatar_url: string;
        };
        user: {
            id: number;
            username: string;
            email: string;
            avatar_url: string;
            birthdate: string;
            status: string;
            about: string;
        };
        total_users: number;
        online_users: number;
    }>;
    publicProfile(id: number): Promise<{
        current_user: null;
        user: {
            id: number;
            username: string;
            avatar_url: string;
            birthdate: string;
            status: string;
            about: string;
        };
        view: "self" | "public" | "preview";
        total_users: number;
        online_users: number;
    }>;
    editProfile(user: AuthUser): Promise<{
        current_user: {
            id: number;
            userId: number;
            username: string;
            avatar_url: string;
        };
        user: {
            username: string;
            email: string;
            avatar_url: string;
            birthdate: string;
            status: string;
            about: string;
        };
        total_users: number;
        online_users: number;
    }>;
    saveProfile(user: AuthUser, file: Express.Multer.File, body: any): Promise<{
        ok: boolean;
        redirect: string;
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
    byId(user: AuthUser, id: number): Promise<{
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
    patch(user: AuthUser, dto: UpdateProfileDto): Promise<{
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
