import { WorldService } from './world.service';
import { CreateActionDto, EditActionDto, PublishActionDto } from './world.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class WorldController {
    private readonly service;
    constructor(service: WorldService);
    view(user: AuthUser): Promise<{
        user: AuthUser;
        feed: {
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
        };
        published: {
            id: number;
            text: string;
        }[];
    }>;
    pFeed(user: AuthUser): Promise<{
        feed: {
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
        };
    }>;
    pPublished(): Promise<{
        actions: {
            id: number;
            text: string;
        }[];
    }>;
    getWorld(user: AuthUser): Promise<{
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
    createDraft(user: AuthUser, dto: CreateActionDto): Promise<{
        id: number;
        userId: number | null;
        text: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        normalizedText: string;
    }>;
    edit(user: AuthUser, id: string, dto: EditActionDto): Promise<{
        id: number;
        userId: number | null;
        text: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        normalizedText: string;
    }>;
    delete(user: AuthUser, id: string): Promise<{
        id: number;
        userId: number | null;
        text: string;
        isPublished: boolean;
        isDaily: boolean;
        createdAt: Date;
        expiresAt: Date | null;
        normalizedText: string;
    }>;
    publish(user: AuthUser, id: string, dto: PublishActionDto): Promise<{
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
    mark(user: AuthUser, id: string): Promise<{
        success: boolean;
    }>;
    getMarkCounts(): Promise<Record<number, number>>;
}
