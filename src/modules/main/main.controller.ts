import { Controller, Get, UseGuards, Render } from '@nestjs/common';
import { MainService } from './main.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class MainController {
  constructor(private readonly mainService: MainService) {}

  // Публичная домашняя страница (index.html)
  @Get('/')
  @Render('index')   // => templates/index.html
  home() {
    return { page: 'index', ok: true };
  }

  // Приватная главная (main.html)
  @UseGuards(JwtAuthGuard)
  @Get('/main')
  @Render('main')    // => templates/main.html
  async main(@CurrentUser() user: AuthUser) {
    const top_actions = await this.mainService.getTopActions();
    return { top_actions, user };
  }
}
