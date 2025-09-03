import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = {
  userId: number;
  username: string;
  avatarUrl?: string;   // <-- добавили
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
