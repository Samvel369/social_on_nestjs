import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { map } from 'rxjs/operators';

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

    // 1) Протолкнём current_user в res.locals (работает для @Render)
    try {
      const u = req.user;
      if (u && res?.locals) {
        res.locals.current_user = {
          id: u.userId ?? u.id,
          userId: u.userId ?? u.id,
          username: u.username,
          avatar_url: u.avatarUrl ?? '',
        };
      }
    } catch {
      /* ignore */
    }

    try {
      res.locals.total_users = await this.prisma.user.count();
    } catch {
      res.locals.total_users = 0;
    }
    try {
      res.locals.online_users = this.rt.getOnlineCount();
    } catch {
      res.locals.online_users = 0;
    }

    // 2) А на всякий случай добавим current_user в объект, который возвращает @Render()
    return next.handle().pipe(
      map((data) => {
        const out: any = (data && typeof data === 'object' && !Array.isArray(data)) ? { ...data } : (data ?? {});

        // добавим current_user, если контроллер сам не положил
        if (res?.locals?.current_user && !('current_user' in out)) {
          out.current_user = res.locals.current_user;
        }

        // ДОБАВИМ СЧЁТЧИКИ — это и есть фикc
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
