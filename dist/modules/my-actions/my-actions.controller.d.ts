import { MyActionsService } from './my-actions.service';
import { CreateActionDto, DeleteActionDto, PublishActionDto } from './my-actions.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class MyActionsController {
    private readonly service;
    constructor(service: MyActionsService);
    view(user: AuthUser): Promise<{
        current_user: {
            id: number;
            userId: number;
            username: string;
            avatar_url: string;
        };
        drafts: any[];
        published: any[];
        total_users: number;
        online_users: number;
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
