import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Render,
} from '@nestjs/common';
import { WorldService } from './world.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@Controller('world')
export class WorldController {
  constructor(private readonly service: WorldService) {}

  // ===== HTML =====
  // Приватная страница "Мир" -> templates/world.html
  @UseGuards(JwtAuthGuard)
  @Get('view')
  @Render('world.html')
  async view(@CurrentUser() user: AuthUser) {
    // Прокидываем current_user в base.html, чтобы меню стало "авторизованным"
    const current_user = {
      id: user.userId,
      username: user.username,
      avatar_url: (user as any).avatarUrl ?? '',
    };

    // Пока без реальных данных, чтобы страница стабильно открывалась.
    // Когда пришлёшь world.service.ts / my-actions.service.ts — подключу сюда настоящие списки.
    const daily_actions: any[] = [];
    const published: any[] = [];
    const drafts: any[] = [];

    const total_users = 0;
    const online_users = 0;

    return {
      current_user,
      daily_actions,
      published,
      drafts,
      total_users,
      online_users,
    };
  }

  // ===== JSON API (оставляем рабочие ручки, которые уже есть у сервиса) =====

  // Отметка действия (если где-то используешь /api/world/mark/:id)
  @UseGuards(JwtAuthGuard)
  @Post('mark/:id')
  async mark(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.markAction(
      user.userId,
      Number(id),
      user.username ?? `user${user.userId}`,
    );
  }

  // Публичный счётчик отметок (если где-то используешь /api/world/mark-counts)
  @Get('mark-counts')
  getMarkCounts() {
    return this.service.getMarkCounts();
  }
}
