import { MainService } from './main.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class MainController {
    private readonly mainService;
    constructor(mainService: MainService);
    home(): {
        page: string;
        ok: boolean;
    };
    main(user: AuthUser): Promise<{
        top_actions: ({
            id: number;
            userId: number | null;
            text: string;
            isPublished: boolean;
            isDaily: boolean;
            createdAt: Date;
            expiresAt: Date | null;
            normalizedText: string;
        } & {
            marks: number;
        })[];
        user: AuthUser;
    }>;
}
