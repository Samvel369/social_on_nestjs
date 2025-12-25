import { Controller, Get, Post, Param, UseGuards, Render, ParseIntPipe } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actions: ActionsService) {}

  // ---------- HTML: Страница карточки (С МЕНЮ!) ----------
  @Get('action_card/:id')
  @UseGuards(JwtAuthGuard) // <--- Теперь доступ только для своих
  @Render('action_card.html')
  async actionCardPage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser, // <--- Получаем данные о тебе
  ) {
    const data = await this.actions.getActionCard(id);

    const userInfo = await this.actions.getUserShortInfo(user.userId);
    
    // Формируем профиль для меню слева
    const current_user = {
      id: user.userId,
      userId: user.userId,
      username: user.username,
      avatar_url: userInfo?.avatarUrl || '/static/default-avatar.png', // 🔥 Вот теперь она есть!
    };

    return {
      action: data.action,
      stats: data.stats, // Передаем статистику (включая publishCount)
      users: data.users,
      total_marks: data.total_marks,
      peak: data.peak,
      current_user, // <--- ВОТ ЭТО вернет меню на место
    };
  }

  // ---------- JSON API (для обновлений JS) ----------
  
  @Get('action/:id')
  getActionCard(@Param('id', ParseIntPipe) id: number) {
    return this.actions.getActionCard(id);
  }

  @Get('action_stats/:id')
  getActionStats(@Param('id', ParseIntPipe) id: number) {
    return this.actions.getActionStats(id);
  }

  @Get('get_top_actions')
  getTopActions() {
    return this.actions.getTopActions();
  }

  @Get('get_mark_counts')
  getMarkCounts() {
    return this.actions.getMarkCounts();
  }

  @Get('get_published_actions')
  getPublishedActions() {
    return this.actions.getPublishedActions();
  }

  @UseGuards(JwtAuthGuard)
  @Post('mark_action/:id')
  mark(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.actions.markAction(
      id,
      user.userId,
      user.username ?? `user${user.userId}`,
    );
  }
}