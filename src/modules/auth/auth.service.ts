import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
      select: { id: true }, // достаточно факта наличия
    });
    if (exists) throw new ConflictException('Пользователь уже существует');

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hash,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : null,
        // lastActive проставится по default(now())
      },
      select: {
        id: true,
        username: true,
        email: true,
        lastActive: true, // ⬅ вместо createdAt
      },
    });

    return { message: 'Регистрация прошла успешно', user };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('Неверный логин или пароль');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Неверный логин или пароль');

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
    });

    return {
      message: 'Успешный вход',
      access_token,                                       // ← вот он
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }
}