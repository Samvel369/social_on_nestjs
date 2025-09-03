import { Body, Controller, Get, Param, Post, UseGuards, Render } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CleanupTimeDto } from './friends.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly svc: FriendsService) {}

  // ---------- HTML ----------
  @UseGuards(JwtAuthGuard)
  @Get('view')
  @Render('friends.html')
  async view(@CurrentUser() user: AuthUser) {
    const u = {
      id: user.userId,
      userId: user.userId,           // дублируем, чтобы оба варианта работали
      username: user.username,
      avatar_url: (user as any)?.avatarUrl ?? '',
    };

    // отдадим обе переменные, на случай если где-то ожидают 'user'
    return {
      current_user: u,
      user: u,
      total_users: 0,
      online_users: 0,
    };
  }

  // ---------- JSON actions (из твоего файла вижу эти методы сервиса) ----------
  @Post('subscribe/:userId')
  subscribe(@Param('userId') target: string, @CurrentUser() user: AuthUser) {
    return this.svc.subscribe(Number(target), user.userId, user.username);
  }

  @Post('cleanup_potential_friends')
  cleanup(@Body() dto: CleanupTimeDto, @CurrentUser() user: AuthUser) {
    return this.svc.cleanupPotentialFriends(dto.minutes, user.userId);
  }

  @Post('leave_in_subscribers/:userId')
  leave(@Param('userId') target: string, @CurrentUser() user: AuthUser) {
    return this.svc.leaveInSubscribers(Number(target), user.userId);
  }
}
