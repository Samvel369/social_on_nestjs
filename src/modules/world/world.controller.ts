import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Render,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { WorldService } from './world.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { getDisplayName } from '../../common/utils/user.utils';

@Controller('world')
@UseGuards(JwtAuthGuard)
export class WorldController {
  constructor(
    private readonly service: WorldService,
    private readonly prisma: PrismaService,
  ) { }

  // 🔥 МОДИФИЦИРОВАННЫЙ МЕТОД: API для получения количества НЕПРОСМОТРЕННЫХ активных действий
  @Get('unseen-actions-count') // Изменил название для ясности, чтобы отличалось от общего количества
  async getUnseenActiveActionsCount(@CurrentUser() user: AuthUser) {
    const count = await this.service.getUnseenActiveActionsCount(user.userId);
    return { count };
  }

  // 🔥 НОВЫЙ МЕТОД: API для отметки о просмотре всех активных действий
  @Post('mark-seen')
  async markWorldAsSeen(@CurrentUser() user: AuthUser) {
    await this.service.markWorldActionsAsSeen(user.userId);
    // После отметки о просмотре, отправляем событие, чтобы обновить бейдж у пользователя
    // (он сбросится, так как все действия станут "просмотренными")
    return { ok: true };
  }

  // ===== HTML =====
  @Get('view')
  @Render('world.html')
  async view(@CurrentUser() user: AuthUser) {
    const me = await this.prisma.user.findUnique({ where: { id: user.userId } });

    const current_user = me ? {
      id: me.id,
      username: getDisplayName(me),
      avatar_url: me.avatarUrl ?? '',
    } : null;

    const daily_actions = await this.service.getDailyActions(user.userId);

    // 🔥 Fetch user's actions (drafts and published) for the "Events" tab
    const myActions = await this.prisma.action.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: { marks: true },
    });

    const published = myActions.filter(a => a.isPublished);
    const drafts = myActions.filter(a => !a.isPublished);

    return {
      current_user,
      daily_actions,
      published,
      drafts,
    };
  }

  // ===== Ежедневные действия (API) =====
  @Get('daily-actions')
  async getDailyActions(@CurrentUser() user: AuthUser) {
    return this.service.getDailyActions(user.userId);
  }

  @Post('daily-mark/:id')
  async markDaily(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.markDailyAction(user.userId, id);
  }

  // ===== JSON API =====
  @Post('mark/:id')
  async mark(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.markAction(
      user.userId,
      Number(id),
      user.username ?? `user${user.userId}`,
    );
  }

  @Get('mark-counts')
  getMarkCounts() {
    return this.service.getMarkCounts();
  }

  @Post('create-draft')
  async createDraft(@CurrentUser() user: AuthUser, @Body() dto: { text: string }) {
    return this.service.createDraft(user.userId, dto);
  }

  @Post('publish/:id')
  async publishAction(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: { duration: number }) {
    return this.service.publishAction(user.userId, id, dto);
  }

  @Post('edit/:id')
  async editAction(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: { text: string }) {
    return this.service.editAction(user.userId, id, dto);
  }

  @Post('delete/:id')
  async deleteAction(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteAction(user.userId, id);
  }
}