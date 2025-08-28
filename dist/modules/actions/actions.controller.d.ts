import { Response } from 'express';
import { ActionsService } from './actions.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class ActionsController {
    private readonly actionsService;
    constructor(actionsService: ActionsService);
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
    mark(id: string, user: AuthUser): Promise<{
        error: string;
        remaining: number;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
        remaining?: undefined;
    }>;
    getMarkCounts(): Promise<Record<number, number>>;
    getPublishedActions(): Promise<{
        id: number;
        text: string;
    }[]>;
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
    renderActionCard(id: string, res: Response): Promise<void>;
}
