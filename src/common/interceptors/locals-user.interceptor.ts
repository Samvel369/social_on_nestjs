import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { map } from 'rxjs/operators';
import { FriendRequestStatus } from '@prisma/client';

@Injectable()
export class LocalsUserInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rt: RealtimeGateway,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    try {
      const u = req.user;
      if (u && res?.locals) {
        res.locals.current_user = {
          id: u.userId ?? u.id,
          userId: u.userId ?? u.id,
          username: u.username,
          avatar_url: u.avatarUrl ?? '',
        };

        // 🔥 Считаем заявки в друзья для начальной отрисовки
        try {
          res.locals.friends_requests_count = await this.prisma.friendRequest.count({
            where: {
              receiverId: u.userId ?? u.id,
              status: FriendRequestStatus.PENDING,
            },
          });
        } catch {
          res.locals.friends_requests_count = 0;
        }
      }
    } catch { /* ignore */ }

    try { res.locals.total_users = await this.prisma.user.count(); } catch { res.locals.total_users = 0; }
    try { res.locals.online_users = this.rt.getOnlineCount(); } catch { res.locals.online_users = 0; }

    return next.handle().pipe(
      map((data) => {
        const out: any = (data && typeof data === 'object' && !Array.isArray(data)) ? { ...data } : (data ?? {});

        if (res?.locals?.current_user && !('current_user' in out)) {
          out.current_user = res.locals.current_user;
        }

        if (typeof res?.locals?.friends_requests_count !== 'undefined' && !('friends_requests_count' in out)) {
          out.friends_requests_count = res.locals.friends_requests_count;
        }
        if (typeof res?.locals?.total_users !== 'undefined' && !('total_users' in out)) {
          out.total_users = res.locals.total_users;
        }
        if (typeof res?.locals?.online_users !== 'undefined' && !('online_users' in out)) {
          out.online_users = res.locals.online_users;
        }

        return out;
      }),
    );
  }
}