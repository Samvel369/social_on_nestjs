import { MyActionsService } from './my-actions.service';
import { CreateActionDto, PublishActionDto, DeleteActionDto } from './my-actions.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class MyActionsController {
    private readonly service;
    constructor(service: MyActionsService);
    view(user: AuthUser): Promise<{
        current_user: {
            id: number;
            userId: number;
            username: string;
            avatar_url: any;
        };
        drafts: {
            id: number;
            text: string;
        }[];
        published: {
            id: number;
            text: string;
            expiresAt: Date | null;
        }[];
    }>;
    list(user: AuthUser): Promise<{
        drafts: {
            id: number;
            text: string;
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
        };
    }>;
    publish(user: AuthUser, dto: PublishActionDto): Promise<{
        ok: boolean;
    }>;
    deleteBody(user: AuthUser, dto: DeleteActionDto): Promise<{
        ok: boolean;
    }>;
    deleteByPost(user: AuthUser, id: number): Promise<{
        ok: boolean;
    }>;
    deleteByDelete(user: AuthUser, id: number): Promise<{
        ok: boolean;
    }>;
}
