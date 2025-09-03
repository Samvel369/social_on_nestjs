import { Controller, Get, UseGuards, Render } from '@nestjs/common';
import { MainService } from './main.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class MainController {
  constructor(private readonly mainService: MainService) {}

  // Гостевая домашняя
  @Get()              // /api
  @Render('index.html')
  root() {
    return {
      current_user: null,
      total_users: 0,
      online_users: 0,
    };
  }

  // Алиас на тот же шаблон, если заходят на /api/
  @Get('index')
  @Render('index.html')
  homeSlash() {
    return this.root();
  }

  // Авторизованная главная
  @UseGuards(JwtAuthGuard)
  @Get('main')        // /api/main
  @Render('main.html')
  async main(@CurrentUser() user: AuthUser) {
    const current_user = {
      id: user.userId,
      userId: user.userId,
      username: user.username,
      avatar_url: (user as any)?.avatarUrl ?? '',
    };

    const top_actions = await this.mainService.getTopActions();

    return {
      current_user,
      top_actions,
      total_users: 0,
      online_users: 0,
    };
  }
}
