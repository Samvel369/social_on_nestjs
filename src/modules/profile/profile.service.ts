import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// import { UpdateProfileDto } from './profile.dto'; // Можно оставить, но мы будем использовать расширенный тип
import { FriendRequestStatus } from '@prisma/client';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService, private readonly rt: RealtimeGateway) {}

  async getMyProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true, // 🔥
        lastName: true,  // 🔥
        email: true,
        avatarUrl: true,
        birthdate: true,
        status: true,
        about: true,
        lastActive: true,
      },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return { user, fullAccess: true, view: 'self' as const };
  }

  async viewProfile(me: number, targetId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        username: true,
        firstName: true, // 🔥
        lastName: true,  // 🔥
        avatarUrl: true,
        birthdate: true,
        status: true,
        about: true,
        lastActive: true,
      },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (user.id === me) {
      return { user, fullAccess: true, view: 'self' as const };
    }

    const isFriend = await this.prisma.friendRequest.findFirst({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [
          { senderId: me, receiverId: targetId },
          { senderId: targetId, receiverId: me },
        ],
      },
      select: { id: true },
    });

    return {
      user,
      fullAccess: Boolean(isFriend),
      view: isFriend ? ('public' as const) : ('preview' as const),
    };
  }

  // Обновляем тип входящих данных (any или расширенный интерфейс)
  async updateProfile(userId: number, dto: any) {
    let birthdate: Date | null | undefined = undefined;
    if (dto.birthdate) {
      const d = new Date(dto.birthdate + 'T00:00:00Z');
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('Неверный формат birthdate (YYYY-MM-DD)');
      }
      birthdate = d;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName || null, // 🔥
        lastName: dto.lastName || null,   // 🔥
        status: dto.status ?? undefined,
        about: dto.about ?? undefined,
        birthdate,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        birthdate: true,
        status: true,
        about: true,
      },
    });

    return { ok: true, user };
  }

  async updateAvatar(userId: number, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не получен');

    const allowed = new Set(['.png', '.jpg', '.jpeg', '.gif']);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowed.has(ext)) {
      try { await fs.unlink(file.path); } catch {}
      throw new BadRequestException('Недопустимый формат файла');
    }

    const publicUrl = '/static/uploads/' + path.basename(file.path);

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl },
    });

    return { ok: true, avatarUrl: publicUrl };
  }

  async touch(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });
    return { ok: true };
  }

  async deleteAccount(userId: number) {
    await this.prisma.user.delete({ where: { id: userId } });  
    const count = await this.prisma.user.count();
    this.rt.broadcastTotalUsers(count);
  }
}