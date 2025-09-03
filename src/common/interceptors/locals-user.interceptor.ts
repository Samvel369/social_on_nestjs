import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LocalsUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const res: any = http.getResponse();

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

    // 2) А на всякий случай добавим current_user в объект, который возвращает @Render()
    return next.handle().pipe(
      map((data) => {
        if (
          res?.locals?.current_user &&
          data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          !('current_user' in data)
        ) {
          return { ...data, current_user: res.locals.current_user };
        }
        return data;
      }),
    );
  }
}
