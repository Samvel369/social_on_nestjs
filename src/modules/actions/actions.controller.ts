import { Controller, Get, Post, Param, UseGuards, Render } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actions: ActionsService) {}

  // ---------- HTML ----------
  // Полноценная страница карточки действия (templates/action_card.html)
  @Get('action_card/:id')
  @Render('action_card.html')
  async actionCardPage(@Param('id') id: string) {
    const data = await this.actions.getActionCard(Number(id));
    return {
      action: data.action,
      users: data.users,               // [{id, username}]
      total_marks: data.total_marks,
      peak: data.peak,
      // сайдбар справа — чтобы base.html не падал
      total_users: 0,
      online_users: 0,
    };
  }

  // ---------- JSON ----------
  // (оставляю имена и сигнатуры под твои методы сервиса)
  @Get('action/:id')
  getActionCard(@Param('id') id: string) {
    return this.actions.getActionCard(Number(id));
  }

  @Get('action_stats/:id')
  getActionStats(@Param('id') id: string) {
    return this.actions.getActionStats(Number(id));
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

  // отметка действия
  @UseGuards(JwtAuthGuard)
  @Post('mark_action/:id')
  mark(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.actions.markAction(
      Number(id),
      user.userId,
      user.username ?? `user${user.userId}`,
    );
  }
}
