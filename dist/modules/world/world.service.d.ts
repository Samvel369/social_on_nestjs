import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { CreateActionDto, EditActionDto, PublishActionDto } from './world.dto';
export declare class WorldService {
    private prisma;
    private rt;
    constructor(prisma: PrismaService, rt: RealtimeGateway);
    getWorld(userId: number): Promise<{
        daily: {
            userId: number;
            id: number;
            text: string;
            normalizedText: string;
            isPublished: boolean;
            isDaily: boolean;
            createdAt: Date;
            expiresAt: Date | null;
        }[];
        drafts: {
            userId: number;
            id: number;
            text: string;
            normalizedText: string;
            isPublished: boolean;
            isDaily: boolean;
            createdAt: Date;
            expiresAt: Date | null;
        }[];
        published: {
            userId: number;
            id: number;
            text: string;
            normalizedText: string;
            isPublished: boolean;
            isDaily: boolean;
            createdAt: Date;
            expiresAt: Date | null;
        }[];
    }>;
    createDaily(dto: CreateActionDto): Promise<{
        userId: number;
        id: number;
        text: string;
        normalizedText: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
    }>;
    createDraft(userId: number, dto: CreateActionDto): Promise<{
        userId: number;
        id: number;
        text: string;
        normalizedText: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
    }>;
    editAction(userId: number, actionId: number, dto: EditActionDto): Promise<{
        userId: number;
        id: number;
        text: string;
        normalizedText: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
    }>;
    deleteAction(userId: number, actionId: number): Promise<{
        userId: number;
        id: number;
        text: string;
        normalizedText: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
    }>;
    publishAction(userId: number, actionId: number, dto: PublishActionDto): Promise<{
        userId: number;
        id: number;
        text: string;
        normalizedText: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
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
