import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Render,
} from '@nestjs/common';
import { MyActionsService } from './my-actions.service';
import {
  CreateActionDto,
  DeleteActionDto,
  PublishActionDto,
} from './my-actions.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard) // весь контроллер приватный
@Controller('my-actions')
export class MyActionsController {
  constructor(private readonly service: MyActionsService) {}

  // ===== HTML =====
  @Get('view')
  @Render('my_actions.html')
  async view(@CurrentUser() user: AuthUser) {
    // ключевая правка: берём аватар из user.avatarUrl
    const current_user = {
      id: user.userId,
      userId: user.userId,
      username: user.username,
      avatar_url: (user as any)?.avatarUrl ?? '',
    };

    // Можно оставить пустые списки — фронт доберёт через JSON по мере надобности
    const drafts: any[] = [];
    const published: any[] = [];
    const total_users = 0;
    const online_users = 0;

    return { current_user, drafts, published, total_users, online_users };
  }

  // ===== JSON API =====

  /** Создать черновик (ожидает тело с { text: string }) */
  @Post('new')
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateActionDto) {
    return this.service.createDraft(user.userId, dto);
  }

  /** Опубликовать черновик (ожидает тело с { id: number, duration: number }) */
  @Post('publish')
  async publish(@CurrentUser() user: AuthUser, @Body() dto: PublishActionDto) {
    return this.service.publishAction(user.userId, dto);
  }

  /** Опубликовать черновик (через путь) */
  @Post('publish/:id/:duration')
  async publishByPath(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('duration', ParseIntPipe) duration: number,
  ) {
    return this.service.publishAction(user.userId, { id, duration });
  }

  /** Удалить (id в теле) */
  @Post('delete')
  async delete(@CurrentUser() user: AuthUser, @Body() dto: DeleteActionDto) {
    return this.service.deleteAction(user.userId, dto.id);
  }

  /** Удалить (id в пути) */
  @Post('delete/:id')
  async deleteByPath(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteAction(user.userId, id);
  }
}
