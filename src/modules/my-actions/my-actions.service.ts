import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActionDto, PublishActionDto, DeleteActionDto } from './my-actions.dto';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
}

@Injectable()
export class MyActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rt: RealtimeGateway,
  ) {}

  /** Список черновиков пользователя */
  async getDrafts(userId: number) {
    return this.prisma.action.findMany({
      where: { userId, isPublished: false },
      select: { id: true, text: true },
      orderBy: { id: 'desc' },
    });
  }

  /** Список публикаций пользователя (и активных, и истекших) */
  async getPublished(userId: number) {
    return this.prisma.action.findMany({
      where: { userId, isPublished: true },
      select: { id: true, text: true, expiresAt: true },
      orderBy: { id: 'desc' },
    });
  }

  /** Создать черновик */
  async createDraft(userId: number, dto: CreateActionDto) {
    const text = (dto.text ?? '').trim();
    if (!text) throw new BadRequestException('text should not be empty');
    if (text.length > 255) throw new BadRequestException('text is too long');

    const norm = normalizeText(text);

    // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
    // 1) Строгая проверка на дубликаты
    // Мы проверяем, есть ли у пользователя действие с таким текстом ВООБЩЕ.
    // Неважно, опубликовано оно, истекло или в черновиках.
    const existing = await this.prisma.action.findFirst({
      where: {
        userId,
        normalizedText: norm,
      },
      select: { id: true, isPublished: true },
    });

    if (existing) {
      // Подсказываем пользователю, где искать его карточку
      if (existing.isPublished) {
        throw new BadRequestException('Такое действие уже есть!');
      } else {
        throw new BadRequestException('Такое действие уже есть в ваших черновиках.');
      }
    }
    // -----------------------

    return this.prisma.action.create({
      data: {
        userId,
        text,
        normalizedText: norm,
        isPublished: false,
      },
      select: { id: true, text: true },
    });
  }

  /** Опубликовать черновик (duration — минуты) */
  async publishAction(userId: number, dto: PublishActionDto) {
    const { id, duration } = dto;
    const draft = await this.prisma.action.findUnique({ where: { id } });
    if (!draft) throw new NotFoundException('Draft not found');
    if (draft.userId !== userId) throw new ForbiddenException('not your action');
    if (draft.isPublished) throw new BadRequestException('already published');

    const norm = draft.normalizedText || normalizeText(draft.text);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (duration ?? 10) * 60_000);

    // 2) ГЛОБАЛЬНАЯ ПРОВЕРКА: Делает ли кто-то в мире это ПРЯМО СЕЙЧАС?
    // Ищем чужое действие с таким же текстом, которое опубликовано и время не истекло
    const globalDuplicate = await this.prisma.action.findFirst({
      where: {
        isPublished: true,
        normalizedText: norm,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });

    if (globalDuplicate) {
      throw new ConflictException('Такое действие уже происходит прямо сейчас! Найдите его в "Нашем мире" и нажмите "Я тоже".');
    }

    return this.prisma.action.update({
      where: { id },
      data: {
        isPublished: true,
        normalizedText: norm,
        createdAt: now,
        expiresAt,
      },
      select: { id: true, text: true, expiresAt: true },
    });
  }

  /** Удалить действие */
  async deleteAction(userId: number, id: number) {
    const action = await this.prisma.action.findUnique({ where: { id } });
    if (!action) throw new NotFoundException('Action not found');
    if (action.userId !== userId) throw new ForbiddenException('not your action');

    if (action.isPublished) {
      await this.prisma.actionMark.deleteMany({ where: { actionId: id } });
    }

    await this.prisma.action.delete({ where: { id } });
    return { ok: true };
  }
}