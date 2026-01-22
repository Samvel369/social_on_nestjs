import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { map } from 'rxjs/operators';
import { FriendRequestStatus } from '@prisma/client';
import { WorldService } from '../../modules/world/world.service'; // 🔥 Добавил импорт WorldService

@Injectable()
export class LocalsUserInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LocalsUserInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rt: RealtimeGateway,
    private readonly worldService: WorldService, // 🔥 Инжектировал WorldService
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

        // Считаем заявки в друзья для начальной отрисовки
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

        // 🔥 МЕТОД: Считаем НЕПРОСМОТРЕННЫЕ активные действия для начальной отрисовки
        try {
            res.locals.world_active_actions_count = await this.worldService.getUnseenActiveActionsCount(u.userId ?? u.id);
        } catch (e) {
            this.logger.error("Error fetching unseen world actions", e);
            res.locals.world_active_actions_count = 0;
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
        // 🔥 Передаем счетчик НЕПРОСМОТРЕННЫХ активных действий
        if (typeof res?.locals?.world_active_actions_count !== 'undefined' && !('world_active_actions_count' in out)) {
            out.world_active_actions_count = res.locals.world_active_actions_count;
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