import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

@Injectable()
export class ActionsService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  // данные для карточки действия
  async getActionCard(actionId: number) {
    const action = await this.prisma.action.findUnique({
      where: { id: actionId },
      select: { id: true, text: true, userId: true, isPublished: true, createdAt: true, expiresAt: true },
    });
    if (!action) return { action: null, total_marks: 0, users: [], peak: 0 };

    // Явно типизируем, берём только нужные поля
    const marks: { userId: number; timestamp: Date }[] =
      await this.prisma.actionMark.findMany({
        where: { actionId },
        orderBy: { timestamp: 'asc' },
        select: { userId: true, timestamp: true },
      });

    const userIds = Array.from(new Set(marks.map(m => m.userId)));
    const users: { id: number; username: string }[] =
      userIds.length
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true },
          })
        : [];

    const minuteCounts: Record<string, number> = {};
    for (const { timestamp } of marks) {
      const d = new Date(timestamp);
      d.setSeconds(0, 0);
      const key = d.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
      minuteCounts[key] = (minuteCounts[key] ?? 0) + 1;
    }
    const peak = Object.values(minuteCounts).reduce((acc, n) => (n > acc ? n : acc), 0);

    return { action, total_marks: marks.length, users, peak };
  }

  // отметка действия + anti-spam 10 минут + potential_friend_view + событие
  async markAction(actionId: number, userId: number, username: string) {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    // антиспам: отметка не чаще раз в 10 минут по одному action
    const recent = await this.prisma.actionMark.findFirst({
      where: { userId, actionId, timestamp: { gte: tenMinutesAgo } },
      select: { timestamp: true },
    });
    if (recent) {
      const remaining = 600 - Math.floor((now.getTime() - recent.timestamp.getTime()) / 1000);
      return { error: 'wait', remaining };
    }

    await this.prisma.actionMark.create({ data: { userId, actionId, timestamp: now } });

    // если отметил не автор — добавим его в potential_friend_view автора
    const action = await this.prisma.action.findUnique({
      where: { id: actionId },
      select: { userId: true },
    });

    if (action && action.userId !== userId) {
      const ownerId = action.userId!;

      // upsert по составному уникальному ключу viewerId_userId
      await this.prisma.potentialFriendView.upsert({
        where:  { viewerId_userId: { viewerId: ownerId, userId } },
        update: { timestamp: now },
        create: { viewerId: ownerId, userId, timestamp: now },
      });

      // событие как во Flask: в комнату user_{ownerId}
      this.rt.emitToUser(ownerId, 'friends:lists:refresh');
    }

    return { success: true };
  }

  // счётчики за последнюю минуту
  async getMarkCounts() {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recent = await this.prisma.actionMark.findMany({
      where: { timestamp: { gte: oneMinuteAgo } },
      select: { actionId: true },
    });

    const counts: Record<number, number> = {};
    for (const m of recent) counts[m.actionId] = (counts[m.actionId] || 0) + 1;
    return counts;
  }

  // опубликованные и не истёкшие
  async getPublishedActions() {
    const now = new Date();
    return this.prisma.action.findMany({
      where: { isPublished: true, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, text: true },
    });
  }

  // статистика по действию
  async getActionStats(actionId: number) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const allMarks: { userId: number }[] = await this.prisma.actionMark.findMany({
      where: { actionId },
      select: { userId: true },
    });

    const recent: { userId: number }[] = await this.prisma.actionMark.findMany({
      where: { actionId, timestamp: { gte: oneMinuteAgo } },
      select: { userId: true },
    });

    const userIds = [...new Set(allMarks.map(m => m.userId))];

    const users: { username: string }[] = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { username: true },
        })
      : [];

    return {
      total_marks: allMarks.length,
      peak: recent.length,
      users: users.map(u => u.username),
    };
  }

  // топ-10 действий по отметкам за последнюю минуту
  async getTopActions() {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const active: { id: number; text: string }[] = await this.prisma.action.findMany({
      where: { isPublished: true, expiresAt: { gt: now } },
      select: { id: true, text: true },
    });

    const recentMarks: { actionId: number }[] = await this.prisma.actionMark.findMany({
      where: { timestamp: { gte: oneMinuteAgo } },
      select: { actionId: true },
    });

    const counts = new Map<number, number>();
    for (const m of recentMarks) {
      counts.set(m.actionId, (counts.get(m.actionId) ?? 0) + 1);
    }

    return active
      .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
      .slice(0, 10)
      .map(a => ({ id: a.id, text: a.text, marks: counts.get(a.id) ?? 0 }));
  }
}
