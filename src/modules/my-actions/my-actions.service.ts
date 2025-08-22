import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActionDto, DeleteActionDto, PublishActionDto } from './my-actions.dto';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

/** Простейшая нормализация текста для сравнения дублей */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\S\r\n]/g, ' ')
    .trim();
}

@Injectable()
export class MyActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rt: RealtimeGateway,
  ) {}

  /** Создать черновик действия (не опубликовано) */
  async createDraft(userId: number, dto: CreateActionDto) {
    const text = dto.text.trim();
    if (!text) {
      throw new BadRequestException('Текст не может быть пустым');
    }

    const action = await this.prisma.action.create({
      data: {
        userId,
        text,
        normalizedText: normalizeText(text),
        isPublished: false,
        isDaily: false,
      },
      select: { id: true, text: true, isPublished: true, createdAt: true },
    });

    return { ok: true, action };
  }

  /** Удалить своё действие (и черновик, и опубликованное) */
  async deleteAction(userId: number, id: number) {
    const action = await this.prisma.action.findUnique({ where: { id } });
    if (!action) throw new NotFoundException('Действие не найдено');
    if (action.userId !== userId) throw new ForbiddenException('Вы не владелец действия');

    await this.prisma.action.delete({ where: { id } });
    return { ok: true };
  }

  /** Опубликовать своё действие на duration минут */
  async publishAction(userId: number, dto: PublishActionDto) {
    const { id, duration } = dto;

    const action = await this.prisma.action.findUnique({ where: { id } });
    if (!action) throw new NotFoundException('Действие не найдено');
    if (action.userId !== userId) throw new ForbiddenException('Вы не владелец действия');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60_000);

    // Проверка на дубликат среди ЕЩЁ АКТИВНЫХ публикаций пользователя
    const normalized = action.normalizedText || normalizeText(action.text);
    const duplicate = await this.prisma.action.findFirst({
      where: {
        userId,
        isPublished: true,
        expiresAt: { gt: now },
        normalizedText: normalized,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException('Похожее опубликованное действие уже активно');
    }

    const updated = await this.prisma.action.update({
      where: { id },
      data: {
        isPublished: true,
        expiresAt,
        normalizedText: normalized,
      },
      select: { id: true, text: true, isPublished: true, expiresAt: true, userId: true },
    });

    // Реалтайм-событие в общий канал (как в Flask-версии)
    this.rt.emitActionCreated({
      id: updated.id,
      text: updated.text,
      userId: updated.userId,
      expiresAt: updated.expiresAt,
    });

    return { ok: true, action: updated };
  }

  /** Выбрать мои черновики */
  async listDrafts(userId: number) {
    return this.prisma.action.findMany({
      where: { userId, isPublished: false },
      orderBy: { id: 'desc' },
      select: { id: true, text: true, createdAt: true },
    });
  }

  /** Выбрать мои активные опубликованные */
  async listPublished(userId: number) {
    const now = new Date();
    return this.prisma.action.findMany({
      where: { userId, isPublished: true, expiresAt: { gt: now } },
      orderBy: { expiresAt: 'asc' },
      select: { id: true, text: true, expiresAt: true },
    });
  }

  /** Собрать страницу "Мои действия": drafts + published */
  async myActionsPage(userId: number) {
    const [drafts, published] = await Promise.all([
      this.listDrafts(userId),
      this.listPublished(userId),
    ]);
    return { drafts, published };
  }
}
