import { FriendsService } from './friends.service';
import { CleanupTimeDto } from './friends.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class FriendsController {
    private readonly svc;
    constructor(svc: FriendsService);
    view(user: AuthUser): Promise<{
        current_user: {
            id: number;
            userId: number;
            username: string;
            avatar_url: any;
        };
        user: {
            id: number;
            userId: number;
            username: string;
            avatar_url: any;
        };
        total_users: number;
        online_users: number;
    }>;
    subscribe(target: string, user: AuthUser): Promise<{
        ok: boolean;
        message: string;
    }>;
    cleanup(dto: CleanupTimeDto, user: AuthUser): Promise<{
        ok: boolean;
    }>;
    leave(target: string, user: AuthUser): Promise<{
        ok: boolean;
    }>;
}
