import { ActionsService } from './actions.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class ActionsController {
    private readonly actions;
    constructor(actions: ActionsService);
    actionCardPage(id: string): Promise<{
        action: {
            id: number;
            userId: number | null;
            text: string;
            isPublished: boolean;
            createdAt: Date;
            expiresAt: Date | null;
        } | null;
        users: never[] | {
            id: number;
            username: string;
        }[];
        total_marks: number;
        peak: number;
        total_users: number;
        online_users: number;
    }>;
    getActionCard(id: string): Promise<{
        action: null;
        total_marks: number;
        users: never[];
        peak: number;
    } | {
        action: {
            id: number;
            userId: number | null;
            text: string;
            isPublished: boolean;
            createdAt: Date;
            expiresAt: Date | null;
        };
        total_marks: number;
        users: {
            id: number;
            username: string;
        }[];
        peak: number;
    }>;
    getActionStats(id: string): Promise<{
        total_marks: number;
        peak: number;
        users: string[];
    }>;
    getTopActions(): Promise<{
        id: number;
        text: string;
        marks: number;
    }[]>;
    getMarkCounts(): Promise<Record<number, number>>;
    getPublishedActions(): Promise<{
        id: number;
        text: string;
    }[]>;
    mark(id: string, user: AuthUser): Promise<{
        error: string;
        remaining: number;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
        remaining?: undefined;
    }>;
}
