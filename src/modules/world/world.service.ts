import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { CreateActionDto, EditActionDto, PublishActionDto } from './world.dto';

@Injectable()
export class WorldService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) { }

  // 🔥 МЕТОД: Подсчет НЕПРОСМОТРЕННЫХ активных действий
  async getUnseenActiveActionsCount(userId: number): Promise<number> {
    // Оптимизация: получаем lastViewedWorldAt и сразу считаем в одном запросе через подзапрос
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastViewedWorldAt: true },
    });

    if (!user) {
      return 0;
    }

    const now = new Date();
    // Считаем действия, которые опубликованы и активны ПОСЛЕ lastViewedWorldAt пользователя
    return this.prisma.action.count({
      where: {
        isPublished: true,
        createdAt: { gt: user.lastViewedWorldAt }, // Опубликовано после последнего просмотра
        expiresAt: { gt: now }, // И еще активно
      },
    });
  }

  // 🔥 НОВЫЙ МЕТОД: Отметить все действия как просмотренные
  async markWorldActionsAsSeen(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastViewedWorldAt: new Date() },
    });
  }

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
    const action = await this.prisma.action.create({
      data: { text: dto.text, isDaily: true, isPublished: true },
    });
    this.rt.emitToAll('world:actions:refresh'); // Уведомляем всех об изменении
    return action;
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
    const deletedAction = await this.prisma.action.delete({ where: { id: actionId } });
    // Если удалили опубликованное действие, возможно, нужно обновить счетчик
    if (deletedAction.isPublished && deletedAction.expiresAt && deletedAction.expiresAt > new Date()) {
      this.rt.emitToAll('world:actions:refresh'); // Уведомляем всех об изменении
    }
    return deletedAction;
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
        expiresAt: { gt: now } // Проверяем только живые действия
      },
    });

    for (const a of recent) {
      if (a.expiresAt && a.expiresAt > now) {
        throw new ForbiddenException('Похожее действие уже опубликовано');
      }
    }

    const updatedAction = await this.prisma.action.update({
      where: { id: actionId },
      data: { isPublished: true, expiresAt: new Date(now.getTime() + dto.duration * 60 * 1000) },
    });
    this.rt.emitToAll('world:actions:refresh'); // Уведомляем всех об изменении
    return updatedAction;
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
    const action = await this.prisma.action.findUnique({
      where: { id: actionId },
      select: { userId: true },
    });

    if (!action || action.userId === userId) {
      return { success: true };
    }

    const ownerId = action.userId!;
    const now = new Date();

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

  // ---------- Ежедневные действия (каждая отметка живёт 1 мин с момента постановки) ----------

  private getOneMinuteAgo(): Date {
    return new Date(Date.now() - 60 * 1000);
  }

  async getDailyActions(userId?: number): Promise<{ id: number; text: string; sortOrder: number; count: number }[]> {
    try {
      const oneMinuteAgo = this.getOneMinuteAgo();
      const [actions, marks, userMarks] = await Promise.all([
        this.prisma.dailyAction.findMany({
          orderBy: { sortOrder: 'asc' },
          select: { id: true, text: true, sortOrder: true },
        }),
        this.prisma.dailyActionMark.findMany({
          where: { createdAt: { gt: oneMinuteAgo } },
          select: { dailyActionId: true },
        }),
        userId
          ? this.prisma.dailyActionMark.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { dailyActionId: true },
          })
          : Promise.resolve([]),
      ]);

      const countMap = new Map<number, number>();
      for (const m of marks) {
        countMap.set(m.dailyActionId, (countMap.get(m.dailyActionId) ?? 0) + 1);
      }

      const base = actions.map((a) => ({
        id: a.id,
        text: a.text,
        sortOrder: a.sortOrder,
        count: countMap.get(a.id) ?? 0,
      }));

      if (userId && userMarks.length > 0) {
        const seen = new Set<number>();
        const order: number[] = [];
        for (const m of userMarks) {
          if (!seen.has(m.dailyActionId)) {
            seen.add(m.dailyActionId);
            order.push(m.dailyActionId);
          }
        }
        const orderById = new Map(order.map((id, i) => [id, i]));
        const marked = base.filter((a) => seen.has(a.id));
        const unmarked = base.filter((a) => !seen.has(a.id));
        marked.sort((a, b) => (orderById.get(a.id) ?? 999) - (orderById.get(b.id) ?? 999));
        return [...marked, ...unmarked];
      }
      return base;
    } catch (e) {
      console.error('[getDailyActions]', e);
      return [];
    }
  }

  /** Защита от спама: не чаще 1 раза в 10 минут на одно действие */
  private readonly DAILY_MARK_COOLDOWN_MS = 10 * 60 * 1000;

  async markDailyAction(userId: number, dailyActionId: number): Promise<{ success: boolean; counts?: Record<number, number>; error?: string; remaining?: number }> {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - this.DAILY_MARK_COOLDOWN_MS);

    const action = await this.prisma.dailyAction.findUnique({ where: { id: dailyActionId }, select: { id: true } });
    if (!action) return { success: false, error: 'Действие не найдено' };

    const existing = await this.prisma.dailyActionMark.findUnique({
      where: { dailyActionId_userId: { dailyActionId, userId } },
      select: { createdAt: true },
    });

    if (existing && existing.createdAt > tenMinutesAgo) {
      const remaining = Math.ceil((existing.createdAt.getTime() + this.DAILY_MARK_COOLDOWN_MS - now.getTime()) / 1000);
      return { success: false, error: 'Подождите 10 минут перед следующей отметкой на это действие', remaining };
    }

    await this.prisma.dailyActionMark.upsert({
      where: { dailyActionId_userId: { dailyActionId, userId } },
      update: { createdAt: now },
      create: { dailyActionId, userId, createdAt: now },
    });

    const counts = await this.getDailyCountsMap();
    this.rt.emitToAll('daily:counts_update', { counts });
    return { success: true, counts };
  }

  private async getDailyCountsMap(): Promise<Record<number, number>> {
    const oneMinuteAgo = this.getOneMinuteAgo();
    const marks = await this.prisma.dailyActionMark.findMany({
      where: { createdAt: { gt: oneMinuteAgo } },
      select: { dailyActionId: true },
    });
    const counts: Record<number, number> = {};
    for (const m of marks) {
      counts[m.dailyActionId] = (counts[m.dailyActionId] ?? 0) + 1;
    }
    return counts;
  }
}