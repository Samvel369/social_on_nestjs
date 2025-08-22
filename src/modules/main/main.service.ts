import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Action, ActionMark } from '@prisma/client';

@Injectable()
export class MainService {
  constructor(private prisma: PrismaService) {}

  // Получить топ-10 активных действий
  async getTopActions(): Promise<(Action & { marks: number })[]> {
    const now = new Date();

    // Опубликованные и не истёкшие
    const activeActions = await this.prisma.action.findMany({
      where: { isPublished: true, expiresAt: { gt: now } },
    });

    // Отметки за последнюю минуту
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const marks = await this.prisma.actionMark.findMany({
      where: { timestamp: { gte: oneMinuteAgo } },
      select: { actionId: true },
    });

    // Считаем количество отметок
    const counts = new Map<number, number>();
    for (const m of marks) {
      counts.set(m.actionId, (counts.get(m.actionId) || 0) + 1);
    }

    // Сортировка по убыванию и top-10
    const sorted = activeActions
      .map(a => ({
        ...a,
        marks: counts.get(a.id) || 0,
      }))
      .sort((a, b) => b.marks - a.marks)
      .slice(0, 10);

    return sorted;
  }
}
