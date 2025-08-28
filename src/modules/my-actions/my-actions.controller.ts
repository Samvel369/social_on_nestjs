import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, Render } from '@nestjs/common';
import { MyActionsService } from './my-actions.service';
import { CreateActionDto, DeleteActionDto, PublishActionDto } from './my-actions.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// общий тип
export type AuthUser = { userId: number; username: string };

@UseGuards(JwtAuthGuard) // весь контроллер приватный
@Controller('my-actions')
export class MyActionsController {
  constructor(private readonly service: MyActionsService) {}

  // ===== HTML =====

  // Страница "Мои действия" -> templates/my_actions.html
  @Get('view')
  @Render('my_actions.html')
  async view(@CurrentUser() user: AuthUser) {
    // во Flask страница показывала и drafts, и published
    return this.service.myActionsPage(user.userId);
  }

  // Паршиалы (если во Flask были отдельные partials)
  @Get('partials/drafts')
  @Render('partials/my_actions_drafts.html') // создай templates/partials/my_actions_drafts.html
  async pDrafts(@CurrentUser() user: AuthUser) {
    const data = await this.service.myActionsPage(user.userId);
    return { drafts: data.drafts ?? [] };
  }

  @Get('partials/published')
  @Render('partials/my_actions_published.html') // создай templates/partials/my_actions_published.html
  async pPublished(@CurrentUser() user: AuthUser) {
    const data = await this.service.myActionsPage(user.userId);
    return { published: data.published ?? [] };
  }

  // ===== JSON API =====

  /** Страница моих действий: drafts + published (JSON) */
  @Get()
  async page(@CurrentUser() user: AuthUser) {
    return this.service.myActionsPage(user.userId);
  }

  /** Создать черновик */
  @Post('new')
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateActionDto) {
    return this.service.createDraft(user.userId, dto);
  }

  /** Опубликовать (id из тела) */
  @Post('publish')
  async publish(@CurrentUser() user: AuthUser, @Body() dto: PublishActionDto) {
    return this.service.publishAction(user.userId, dto);
  }

  /** Опубликовать (id в пути) — удобный вариант */
  @Post('publish/:id/:duration')
  async publishByPath(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('duration', ParseIntPipe) duration: number,
  ) {
    return this.service.publishAction(user.userId, { id, duration });
  }

  /** Удалить (id из тела) */
  @Post('delete')
  async delete(@CurrentUser() user: AuthUser, @Body() dto: DeleteActionDto) {
    return this.service.deleteAction(user.userId, dto.id);
  }

  /** Удалить (id в пути) */
  @Post('delete/:id')
  async deleteByPath(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteAction(user.userId, id);
  }
}
