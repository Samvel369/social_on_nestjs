import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { map } from 'rxjs/operators';
import { FriendRequestStatus } from '@prisma/client';
import { WorldService } from '../../modules/world/world.service';

@Injectable()
export class LocalsUserInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LocalsUserInterceptor.name);

  // Кэширование общего количества пользователей (обновляем раз в 5 минут)
  private static totalUsersCache: number = 0;
  private static lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 300000; // 5 минут

  constructor(
    private readonly prisma: PrismaService,
    private readonly rt: RealtimeGateway,
    private readonly worldService: WorldService,
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    try {
      const u = req.user;
      const promises: Promise<any>[] = [];
      const keys: string[] = [];

      // 1. Данные текущего пользователя
      if (u && res?.locals) {
        res.locals.current_user = {
          id: u.userId ?? u.id,
          userId: u.userId ?? u.id,
          username: u.username,
          avatar_url: u.avatarUrl ?? '',
        };

        const userId = u.userId ?? u.id;

        // Заявки в друзья
        keys.push('friends_requests_count');
        promises.push(
          this.prisma.friendRequest.count({
            where: {
              receiverId: userId,
              status: FriendRequestStatus.PENDING,
            },
          }).catch(() => 0)
        );

        // Непросмотренные действия
        keys.push('world_active_actions_count');
        promises.push(
          this.worldService.getUnseenActiveActionsCount(userId).catch((e) => {
            this.logger.error("Error fetching unseen world actions", e);
            return 0;
          })
        );
      }

      // 2. Общие данные (кэшируемые)
      const now = Date.now();
      if (now - LocalsUserInterceptor.lastCacheUpdate > this.CACHE_TTL) {
        keys.push('total_users');
        promises.push(
          this.prisma.user.count()
            .then((count) => {
              LocalsUserInterceptor.totalUsersCache = count;
              LocalsUserInterceptor.lastCacheUpdate = Date.now();
              return count;
            })
            .catch(() => LocalsUserInterceptor.totalUsersCache)
        );
      } else {
        // Берем из кэша
        res.locals.total_users = LocalsUserInterceptor.totalUsersCache;
      }

      // 3. Онлайн (синхронно, из памяти)
      try {
        res.locals.online_users = this.rt.getOnlineCount();
      } catch {
        res.locals.online_users = 0;
      }

      // Выполняем все промисы параллельно
      if (promises.length > 0) {
        const results = await Promise.all(promises);
        results.forEach((val, index) => {
          res.locals[keys[index]] = val;
        });
      }

    } catch (e) {
      this.logger.error('Error in LocalsUserInterceptor', e);
    }

    return next.handle().pipe(
      map((data) => {
        const out: any = (data && typeof data === 'object' && !Array.isArray(data)) ? { ...data } : (data ?? {});

        if (res?.locals?.current_user && !('current_user' in out)) {
          out.current_user = res.locals.current_user;
        }

        if (typeof res?.locals?.friends_requests_count !== 'undefined' && !('friends_requests_count' in out)) {
          out.friends_requests_count = res.locals.friends_requests_count;
        }

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