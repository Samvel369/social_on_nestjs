import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Delete,
  UseGuards,
  Render,
} from '@nestjs/common';
import { MyActionsService } from './my-actions.service';
import { CreateActionDto, PublishActionDto, DeleteActionDto } from './my-actions.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('my-actions')
export class MyActionsController {
  constructor(private readonly service: MyActionsService) {}

  // HTML
  @Get('view')
  @Render('my_actions.html')
  async view(@CurrentUser() user: AuthUser) {
    const current_user = {
      id: user.userId,
      userId: user.userId,
      username: user.username,
      avatar_url: (user as any)?.avatarUrl ?? '',
    };

    const [drafts, published] = await Promise.all([
      this.service.getDrafts(user.userId),
      this.service.getPublished(user.userId),
    ]);

    

    return { current_user, drafts, published };
  }

  // JSON (для ajax-перерисовки списков)
  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const [drafts, published] = await Promise.all([
      this.service.getDrafts(user.userId),
      this.service.getPublished(user.userId),
    ]);
    return { drafts, published };
  }

  // Создать черновик
  @Post('new')
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateActionDto) {
    const action = await this.service.createDraft(user.userId, dto);
    return { ok: true, action };
  }

  // Опубликовать
  @Post('publish')
  async publish(@CurrentUser() user: AuthUser, @Body() dto: PublishActionDto) {
    await this.service.publishAction(user.userId, dto);
    return { ok: true };
  }

  // Удалить (телом)
  @Post('delete')
  async deleteBody(@CurrentUser() user: AuthUser, @Body() dto: DeleteActionDto) {
    await this.service.deleteAction(user.userId, dto.id);
    return { ok: true };
  }

  // Удалить (из form POST /delete/:id)
  @Post('delete/:id')
  async deleteByPost(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteAction(user.userId, id);
    return { ok: true };
  }

  // Удалить (REST)
  @Delete('delete/:id')
  async deleteByDelete(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteAction(user.userId, id);
    return { ok: true };
  }
}
