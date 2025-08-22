import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { CreateActionDto, EditActionDto, PublishActionDto } from './world.dto';

@Injectable()
export class WorldService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  async getWorld(userId: number) {
    const now = new Date();
    const daily = await this.prisma.action.findMany({ where: { isDaily: true } });
    const drafts = await this.prisma.action.findMany({ where: { userId, isPublished: false } });
    const published = await this.prisma.action.findMany({
      where: { isPublished: true, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    return { daily, drafts, published };
  }

  async createDaily(dto: CreateActionDto) {
    return this.prisma.action.create({
      data: { text: dto.text, isDaily: true, isPublished: true },
    });
  }

  async createDraft(userId: number, dto: CreateActionDto) {
    return this.prisma.action.create({
      data: { userId, text: dto.text, isPublished: false },
    });
  }

  async editAction(userId: number, actionId: number, dto: EditActionDto) {
    const action = await this.prisma.action.findUnique({ where: { id: actionId } });
    if (!action || action.userId !== userId) throw new ForbiddenException();
    return this.prisma.action.update({ where: { id: actionId }, data: { text: dto.text } });
  }

  async deleteAction(userId: number, actionId: number) {
    const action = await this.prisma.action.findUnique({ where: { id: actionId } });
    if (!action || action.userId !== userId) throw new ForbiddenException();
    return this.prisma.action.delete({ where: { id: actionId } });
  }

  async publishAction(userId: number, actionId: number, dto: PublishActionDto) {
    const action = await this.prisma.action.findUnique({ where: { id: actionId } });
    if (!action || action.userId !== userId) throw new ForbiddenException();

    const now = new Date();
    const recent = await this.prisma.action.findMany({
      where: {
        userId,
        isPublished: true,
        text: { contains: action.text },
      },
    });

    for (const a of recent) {
      if (a.expiresAt && a.expiresAt > now) {
        throw new ForbiddenException('Похожее действие уже опубликовано');
      }
    }

    return this.prisma.action.update({
      where: { id: actionId },
      data: { isPublished: true, expiresAt: new Date(now.getTime() + dto.duration * 60 * 1000) },
    });
  }

  async getPublished() {
    const now = new Date();
    return this.prisma.action.findMany({
      where: { isPublished: true, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, text: true },
    });
  }

  async markAction(userId: number, actionId: number, username: string) {
    // Берём только userId, чтобы TS точно знал, что поле есть
    const action = await this.prisma.action.findUnique({
      where: { id: actionId },
      select: { userId: true },
    });

    if (!action || action.userId === userId) {
      return { success: true }; // нечего делать
    }

    const ownerId = action.userId!;
    const now = new Date();

    // ищем существующую записьPotentialFriendView
    const existing = await this.prisma.potentialFriendView.findFirst({
      where: { viewerId: ownerId, userId },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.potentialFriendView.update({
        where: { id: existing.id },
        data: { timestamp: now },
      });
    } else {
      await this.prisma.potentialFriendView.create({
        data: { viewerId: ownerId, userId, timestamp: now },
      });
    }

    this.rt.emitToLegacyUserRoom(ownerId, 'update_possible_friends', {
      user_id: userId,
      username,
    });

    return { success: true };
  }

  async getMarkCounts() {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recent = await this.prisma.actionMark.findMany({ where: { timestamp: { gte: oneMinuteAgo } } });
    const counts: Record<number, number> = {};
    for (const m of recent) counts[m.actionId] = (counts[m.actionId] || 0) + 1;
    return counts;
  }
}
