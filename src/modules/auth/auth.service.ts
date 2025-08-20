import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
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
      select: { id: true, username: true, email: true, createdAt: true },
    });

    return { message: 'Регистрация прошла успешно', user };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('Неверный логин или пароль');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Неверный логин или пароль');

    return {
      message: 'Успешный вход',
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
    };
  }
}
