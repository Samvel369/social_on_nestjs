// src/modules/auth/auth.service.ts
import {
  Injectable, BadRequestException, ConflictException, UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Пользователь уже существует');

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hash,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : null,
      },
      select: { id: true, username: true, email: true, lastActive: true },
    });

    return { message: 'Регистрация прошла успешно', user };
  }

  async login(dto: LoginDto) {
    // берём только нужные поля, но включаем password для сравнения
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true, username: true, email: true, password: true, lastActive: true },
    });
    if (!user) throw new UnauthorizedException('Неверный логин или пароль');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Неверный логин или пароль');

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
    });

    return {
      message: 'Успешный вход',
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        // если фронт ждёт createdAt, маппим lastActive под этим именем:
        createdAt: user.lastActive, // ← ключ остаётся "createdAt", значение из lastActive
      },
    };
  }
}
