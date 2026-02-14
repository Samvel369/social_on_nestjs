import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

@Injectable()
export class ActionsService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) { }

  // Данные для карточки действия
  async getActionCard(actionId: number) {
    // 1. Ищем действие (ВАЖНО: добавляем publishCount в выборку)
    const action = await this.prisma.action.findUnique({
      where: { id: actionId },
      select: {
        id: true,
        text: true,
        userId: true,
        isPublished: true,
        createdAt: true,
        expiresAt: true,
        publishCount: true // <--- Забираем счетчик публикаций
      },
    });

    // Если нет действия — возвращаем пустышку
    if (!action) {
      return {
        action: null,
        total_marks: 0,
        users: [],
        peak: 0,
        stats: { totalMarks: 0, uniqueUsers: 0, peakCount: 0 }
      };
    }

    // 2. Получаем все отметки
    const marks = await this.prisma.actionMark.findMany({
      where: { actionId },
      orderBy: { timestamp: 'asc' },
      select: { userId: true, timestamp: true },
    });

    // 3. Считаем уникальных пользователей
    const userIds = Array.from(new Set(marks.map(m => m.userId)));

    // Загружаем имена пользователей для списка
    const users = userIds.length
      ? await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true },
      })
      : [];

    // 4. Считаем пик активности (по минутам)
    const minuteCounts: Record<string, number> = {};
    for (const { timestamp } of marks) {
      const d = new Date(timestamp);
      d.setSeconds(0, 0);
      const key = d.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
      minuteCounts[key] = (minuteCounts[key] ?? 0) + 1;
    }
    const peak = Object.values(minuteCounts).reduce((acc, n) => (n > acc ? n : acc), 0);

    // 5. Формируем объект статистики для контроллера
    const stats = {
      totalMarks: marks.length,
      uniqueUsers: userIds.length,
      peakCount: peak,
    };

    return {
      action,
      total_marks: marks.length,
      users,
      peak,
      stats // <--- Теперь он есть!
    };
  }

  // --- Остальные методы (без изменений) ---

  // Отметка действия + anti-spam + уведомления
  async markAction(actionId: number, userId: number, username: string) {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const recent = await this.prisma.actionMark.findFirst({
      where: { userId, actionId, timestamp: { gte: tenMinutesAgo } },
      select: { timestamp: true },
    });
    if (recent) {
      const remaining = 600 - Math.floor((now.getTime() - recent.timestamp.getTime()) / 1000);
      return { error: 'wait', remaining };
    }

    await this.prisma.actionMark.create({ data: { userId, actionId, timestamp: now } });

    // 🔥 NEW LOGIC: Time Window (1 minute) for Mutual "Moments"
    console.log(`[MarkAction] User ${userId} marked action ${actionId} at ${now.toISOString()}`);

    // Find others who marked this action within the last 60 seconds
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Find matches (excluding self)
    const matches = await this.prisma.actionMark.findMany({
      where: {
        actionId,
        userId: { not: userId },
        timestamp: { gte: oneMinuteAgo },
      },
      select: { userId: true },
    });

    console.log(`[MarkAction] Found ${matches.length} matches in the last minute:`, matches);

    // Create mutual links
    if (matches.length > 0) {
      const matchIds = [...new Set(matches.map(m => m.userId))];

      for (const otherUserId of matchIds) {
        console.log(`[MarkAction] Linking User ${userId} to User ${otherUserId} (Forward-Only)`);

        // 1. "They see Me" (because I joined their window)
        // viewer: otherUserId (The one who started the window), user: userId (Me, the one who joined)
        await this.prisma.potentialFriendView.upsert({
          where: { viewerId_userId: { viewerId: otherUserId, userId } },
          update: { timestamp: now },
          create: { viewerId: otherUserId, userId, timestamp: now },
        });

        // NOT doing "I see Them" anymore. My window just started.

        // Notify only the list owner (The one who sees me)
        this.rt.emitToUser(otherUserId, 'friends:lists:refresh');
      }
    }

    return { success: true };
  }

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

  async getPublishedActions() {
    const now = new Date();
    return this.prisma.action.findMany({
      where: { isPublished: true, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, text: true },
    });
  }

  async getActionStats(actionId: number) {
    // Внимание: здесь возвращаем упрощенную структуру для AJAX обновлений
    // Если нужно, чтобы AJAX обновлял всё, можно вызвать this.getActionCard(actionId)
    // Но пока оставим как было, чтобы JS не сломался
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const allMarks = await this.prisma.actionMark.findMany({
      where: { actionId },
      select: { userId: true },
    });

    const recent = await this.prisma.actionMark.findMany({
      where: { actionId, timestamp: { gte: oneMinuteAgo } },
      select: { userId: true },
    });

    const userIds = [...new Set(allMarks.map(m => m.userId))];

    const users = userIds.length
      ? await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { username: true },
      })
      : [];

    // Здесь JS ждет total_marks, peak и users (массив строк или объектов)
    return {
      total_marks: allMarks.length,
      peak: recent.length,
      users: users.map(u => u.username),
    };
  }

  async getTopActions() {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const active = await this.prisma.action.findMany({
      where: { isPublished: true, expiresAt: { gt: now } },
      select: { id: true, text: true },
    });

    const recentMarks = await this.prisma.actionMark.findMany({
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

  async getUserShortInfo(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, username: true },
    });
  }
}