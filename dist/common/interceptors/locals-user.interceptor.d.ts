import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
export declare class LocalsUserInterceptor implements NestInterceptor {
    private readonly prisma;
    private readonly rt;
    constructor(prisma: PrismaService, rt: RealtimeGateway);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
