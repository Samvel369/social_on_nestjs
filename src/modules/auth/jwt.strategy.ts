import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

type JwtPayload = { sub: number; username: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      // Берём JWT из cookie.token (обязательно вернуть string | null)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any): string | null => (req?.cookies?.token ? req.cookies.token : null),
      ]),
      ignoreExpiration: false,
      // Убери ошибку типов: env может быть undefined — задаём дефолт, либо используй "!"
      secretOrKey: process.env.JWT_SECRET ?? 'change_me_dev_secret',
    });
  }

  // Добавляем avatarUrl в req.user — пригодится для сайдбара/интерсептора
  async validate(payload: JwtPayload) {
    const row = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, avatarUrl: true, lifeBalance: true },
    });

    return {
      userId: row?.id ?? payload.sub,
      username: row?.username ?? payload.username,
      avatarUrl: row?.avatarUrl ?? '',
      lifeBalance: row?.lifeBalance ?? 0,
    };
  }
}
