import { PrismaService } from '../../prisma/prisma.service';
import { CreateActionDto, PublishActionDto } from './my-actions.dto';
export declare class MyActionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
