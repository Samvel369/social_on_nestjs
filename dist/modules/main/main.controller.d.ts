import { MainService } from './main.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class MainController {
    private readonly mainService;
    constructor(mainService: MainService);
    root(): {
        current_user: null;
        total_users: number;
        online_users: number;
    };
    homeSlash(): {
        current_user: null;
        total_users: number;
        online_users: number;
    };
    main(user: AuthUser): Promise<{
        current_user: {
            id: number;
            userId: number;
            username: string;
            avatar_url: any;
        };
        top_actions: ({
            userId: number;
            id: number;
            text: string;
            normalizedText: string;
            isPublished: boolean;
            isDaily: boolean;
            createdAt: Date;
            expiresAt: Date | null;
        } & {
            marks: number;
        })[];
        total_users: number;
        online_users: number;
    }>;
}
