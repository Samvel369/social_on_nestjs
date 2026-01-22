import { Controller, Get, UseGuards, Render } from '@nestjs/common';
import { MainService } from './main.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { getDisplayName } from '../../common/utils/user.utils';

@Controller()
export class MainController {
  constructor(private readonly mainService: MainService, private readonly prisma: PrismaService,
  private readonly rt: RealtimeGateway,) {}

  // Гостевая домашняя
  @Get()              
  @Render('index.html')
  root() {
    return {
      current_user: null,
    };
  }

  // Алиас
  @Get('index')
  @Render('index.html')
  homeSlash() {
    return this.root();
  }

  // Авторизованная главная
  @UseGuards(JwtAuthGuard)
  @Get('main')        
  @Render('main.html')
  async main(@CurrentUser() user: AuthUser) {
    // 🔥 Достаем полные данные для имени
    const me = await this.prisma.user.findUnique({ where: { id: user.userId } });
    
    const current_user = me ? {
      id: me.id,
      userId: me.id,
      username: getDisplayName(me), // 🔥 Красивое имя
      avatar_url: me.avatarUrl ?? '',
    } : null;

    const top_actions = await this.mainService.getTopActions();

    return {
      current_user,
      top_actions,
    };
  }
}