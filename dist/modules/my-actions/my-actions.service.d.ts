import { PrismaService } from '../../prisma/prisma.service';
import { CreateActionDto, PublishActionDto } from './my-actions.dto';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
export declare class MyActionsService {
    private readonly prisma;
    private readonly rt;
    constructor(prisma: PrismaService, rt: RealtimeGateway);
    getDrafts(userId: number): Promise<{
        id: number;
        text: string;
    }[]>;
    getPublished(userId: number): Promise<{
        id: number;
        text: string;
        expiresAt: Date | null;
    }[]>;
    createDraft(userId: number, dto: CreateActionDto): Promise<{
        id: number;
        text: string;
    }>;
    publishAction(userId: number, dto: PublishActionDto): Promise<{
        id: number;
        text: string;
        expiresAt: Date | null;
    }>;
    deleteAction(userId: number, id: number): Promise<{
        ok: boolean;
    }>;
}
