import { MyActionsService } from './my-actions.service';
import { CreateActionDto, DeleteActionDto, PublishActionDto } from './my-actions.dto';
export type AuthUser = {
    userId: number;
    username: string;
};
export declare class MyActionsController {
    private readonly service;
    constructor(service: MyActionsService);
    view(user: AuthUser): Promise<{
        drafts: {
            id: number;
            text: string;
            createdAt: Date;
        }[];
        published: {
            id: number;
            text: string;
            expiresAt: Date | null;
        }[];
    }>;
    pDrafts(user: AuthUser): Promise<{
        drafts: {
            id: number;
            text: string;
            createdAt: Date;
        }[];
    }>;
    pPublished(user: AuthUser): Promise<{
        published: {
            id: number;
            text: string;
            expiresAt: Date | null;
        }[];
    }>;
    page(user: AuthUser): Promise<{
        drafts: {
            id: number;
            text: string;
            createdAt: Date;
        }[];
        published: {
            id: number;
            text: string;
            expiresAt: Date | null;
        }[];
    }>;
    create(user: AuthUser, dto: CreateActionDto): Promise<{
        ok: boolean;
        action: {
            id: number;
            text: string;
            isPublished: boolean;
            createdAt: Date;
        };
    }>;
    publish(user: AuthUser, dto: PublishActionDto): Promise<{
        ok: boolean;
        action: {
            id: number;
            userId: number | null;
            text: string;
            isPublished: boolean;
            expiresAt: Date | null;
        };
    }>;
    publishByPath(user: AuthUser, id: number, duration: number): Promise<{
        ok: boolean;
        action: {
            id: number;
            userId: number | null;
            text: string;
            isPublished: boolean;
            expiresAt: Date | null;
        };
    }>;
    delete(user: AuthUser, dto: DeleteActionDto): Promise<{
        ok: boolean;
    }>;
    deleteByPath(user: AuthUser, id: number): Promise<{
        ok: boolean;
    }>;
}
