import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './profile.dto';
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

  /** Просмотр чужого профиля с логикой “свой / друг / превью” */
  async viewProfile(me: number, targetId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        username: true,
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

  /** Редактирование полей профиля */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
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
        status: dto.status ?? undefined,
        about: dto.about ?? undefined,
        birthdate,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        birthdate: true,
        status: true,
        about: true,
      },
    });

    return { ok: true, user };
  }

  /** Обновить аватар (файл уже сохранён Multer’ом) */
  async updateAvatar(userId: number, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не получен');

    // Разрешённые расширения
    const allowed = new Set(['.png', '.jpg', '.jpeg', '.gif']);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowed.has(ext)) {
      // Удалим сохранённый временный файл, если он есть
      try { await fs.unlink(file.path); } catch {}
      throw new BadRequestException('Недопустимый формат файла');
    }

    // Файл уже лежит в static/uploads/<uuid>.<ext>, формируем URL
    const publicUrl = '/static/uploads/' + path.basename(file.path);

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl },
    });

    return { ok: true, avatarUrl: publicUrl };
  }

  /** Обновить lastActive (аналог update_activity) */
  async touch(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });
    return { ok: true };
  }

  /** Полное удаление аккаунта */
  async deleteAccount(userId: number) {
    await this.prisma.user.delete({
      where: { id: userId },
    });  
    // Благодаря onDelete: Cascade в Prisma, одной строчки достаточно,
    // чтобы удалить User и ВСЕ его связи (лайки, посты, друзей)
    //обновляем счетчики
    const count = await this.prisma.user.count();
    this.rt.broadcastTotalUsers(count);
  }
}
