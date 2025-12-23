import { WorldService } from './world.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class WorldController {
    private readonly service;
    constructor(service: WorldService);
    view(user: AuthUser): Promise<{
        current_user: {
            id: number;
            username: string;
            avatar_url: any;
        };
        daily_actions: any[];
        published: any[];
        drafts: any[];
    }>;
    mark(user: AuthUser, id: string): Promise<{
        success: boolean;
    }>;
    getMarkCounts(): Promise<Record<number, number>>;
}
