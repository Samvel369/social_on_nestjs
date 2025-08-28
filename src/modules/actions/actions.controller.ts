import { Controller, Get, Post, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ActionsService } from './actions.service';
import { JwtAuthGuard } from '../auth/jwt.guard'; // modules/auth/jwt.guard.ts
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  // === API: JSON =================================================================

  // GET /api/actions/action/:id
  @Get('action/:id')
  getActionCard(@Param('id') id: string) {
    return this.actionsService.getActionCard(Number(id));
  }

  // POST /api/actions/mark_action/:id
  @UseGuards(JwtAuthGuard)
  @Post('mark_action/:id')
  mark(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.actionsService.markAction(
      Number(id),
      user.userId,
      user.username ?? `user${user.userId}`,
    );
  }

  @Get('get_mark_counts')
  getMarkCounts() {
    return this.actionsService.getMarkCounts();
  }

  @Get('get_published_actions')
  getPublishedActions() {
    return this.actionsService.getPublishedActions();
  }

  @Get('action_stats/:id')
  getActionStats(@Param('id') id: string) {
    return this.actionsService.getActionStats(Number(id));
  }

  @Get('get_top_actions')
  getTopActions() {
    return this.actionsService.getTopActions();
  }

  // === HTML: паршиал карточки ====================================================

  /**
   * Рендерит паршиал templates/partials/action_card.html
   * чтобы фронт мог подгрузить готовую вёрстку через fetch и вставить в DOM.
   *
   * GET /api/actions/partials/action_card/:id
   */
  @Get('action_card/:id')
  async renderActionCard(@Param('id') id: string, @Res() res: Response) {
    const data = await this.actionsService.getActionCard(Number(id));
    // Во Flask этот паршиал обычно ожидает: action, users, total_marks, peak
    return res.render('partials/action_card.html', {
      action: data.action,
      users: data.users,
      total_marks: data.total_marks,
      peak: data.peak,
    });
  }
}
