import { Controller, Get, Post, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { ActionsService } from './actions.service';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  // GET /api/actions/action/:id
  @Get('action/:id')
  getActionCard(@Param('id') id: string) {
    return this.actionsService.getActionCard(Number(id));
  }

  // POST /api/actions/mark_action/:id
  @Post('mark_action/:id')
  mark(@Param('id') id: string, @Req() req: Request) {
    // userId: из заголовка X-User-Id → из req.user → fallback 1
    const xid = req.headers['x-user-id'];
    const fromHeader = Array.isArray(xid)
      ? parseInt(xid[0] as string, 10)
      : xid !== undefined
      ? parseInt(xid as string, 10)
      : NaN;

    const userFromReq = (req as any).user?.userId;
    const userId =
      Number.isFinite(fromHeader) ? fromHeader :
      typeof userFromReq === 'number' ? userFromReq : 1;

    // username: X-Username → req.user.username → user{userId}
    const xname = req.headers['x-username'];
    const usernameHeader = Array.isArray(xname) ? (xname[0] as string) : (xname as string | undefined);
    const username = usernameHeader ?? (req as any).user?.username ?? `user${userId}`;

    return this.actionsService.markAction(Number(id), userId, username);
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
}
