import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { CreateActionDto, EditActionDto, PublishActionDto } from './world.dto';
export declare class WorldService {
    private prisma;
    private rt;
    constructor(prisma: PrismaService, rt: RealtimeGateway);
    getWorld(userId: number): Promise<{
        daily: {
            id: number;
            userId: number | null;
            text: string;
            isPublished: boolean;
            isDaily: boolean;
            createdAt: Date;
            expiresAt: Date | null;
            normalizedText: string;
        }[];
        drafts: {
            id: number;
            userId: number | null;
            text: string;
            isPublished: boolean;
            isDaily: boolean;
            createdAt: Date;
            expiresAt: Date | null;
            normalizedText: string;
        }[];
        published: {
            id: number;
            userId: number | null;
            text: string;
            isPublished: boolean;
            isDaily: boolean;
            createdAt: Date;
            expiresAt: Date | null;
            normalizedText: string;
        }[];
    }>;
    createDaily(dto: CreateActionDto): Promise<{
        id: number;
        userId: number | null;
        text: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        normalizedText: string;
    }>;
    createDraft(userId: number, dto: CreateActionDto): Promise<{
        id: number;
        userId: number | null;
        text: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        normalizedText: string;
    }>;
    editAction(userId: number, actionId: number, dto: EditActionDto): Promise<{
        id: number;
        userId: number | null;
        text: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        normalizedText: string;
    }>;
    deleteAction(userId: number, actionId: number): Promise<{
        id: number;
        userId: number | null;
        text: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        normalizedText: string;
    }>;
    publishAction(userId: number, actionId: number, dto: PublishActionDto): Promise<{
        id: number;
        userId: number | null;
        text: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        normalizedText: string;
    }>;
    getPublished(): Promise<{
        id: number;
        text: string;
    }[]>;
    markAction(userId: number, actionId: number, username: string): Promise<{
        success: boolean;
    }>;
    getMarkCounts(): Promise<Record<number, number>>;
}
