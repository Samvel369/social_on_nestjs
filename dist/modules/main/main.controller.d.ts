import { MainService } from './main.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
export declare class MainController {
    private readonly mainService;
    private readonly prisma;
    private readonly rt;
    constructor(mainService: MainService, prisma: PrismaService, rt: RealtimeGateway);
    root(): {
        current_user: null;
    };
    homeSlash(): {
        current_user: null;
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
    }>;
}
