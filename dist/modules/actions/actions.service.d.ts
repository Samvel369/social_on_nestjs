import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
export declare class ActionsService {
    private prisma;
    private rt;
    constructor(prisma: PrismaService, rt: RealtimeGateway);
    getActionCard(actionId: number): Promise<{
        action: null;
        total_marks: number;
        users: never[];
        peak: number;
    } | {
        action: {
            userId: number;
            id: number;
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
    markAction(actionId: number, userId: number, username: string): Promise<{
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
    getActionStats(actionId: number): Promise<{
        total_marks: number;
        peak: number;
        users: string[];
    }>;
    getTopActions(): Promise<{
        id: number;
        text: string;
        marks: number;
    }[]>;
}
