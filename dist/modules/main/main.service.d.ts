import { PrismaService } from '../../prisma/prisma.service';
import { Action } from '@prisma/client';
export declare class MainService {
    private prisma;
    constructor(prisma: PrismaService);
    getTopActions(): Promise<(Action & {
        marks: number;
    })[]>;
}
