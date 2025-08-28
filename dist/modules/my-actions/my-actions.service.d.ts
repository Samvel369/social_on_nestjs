import { PrismaService } from '../../prisma/prisma.service';
import { CreateActionDto, PublishActionDto } from './my-actions.dto';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
export declare class MyActionsService {
    private readonly prisma;
    private readonly rt;
    constructor(prisma: PrismaService, rt: RealtimeGateway);
    createDraft(userId: number, dto: CreateActionDto): Promise<{
        ok: boolean;
        action: {
            id: number;
            text: string;
            isPublished: boolean;
            createdAt: Date;
        };
    }>;
    deleteAction(userId: number, id: number): Promise<{
        ok: boolean;
    }>;
    publishAction(userId: number, dto: PublishActionDto): Promise<{
        ok: boolean;
        action: {
            id: number;
            userId: number | null;
            text: string;
            isPublished: boolean;
            expiresAt: Date | null;
        };
    }>;
    listDrafts(userId: number): Promise<{
        id: number;
        text: string;
        createdAt: Date;
    }[]>;
    listPublished(userId: number): Promise<{
        id: number;
        text: string;
        expiresAt: Date | null;
    }[]>;
    myActionsPage(userId: number): Promise<{
        drafts: {
            id: number;
            text: string;
            createdAt: Date;
        }[];
        published: {
            id: number;
            text: string;
            expiresAt: Date | null;
        }[];
    }>;
}
