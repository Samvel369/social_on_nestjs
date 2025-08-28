import { Body, Controller, Get, Param, Post, Delete, Patch, UseGuards, Render } from '@nestjs/common';
import { WorldService } from './world.service';
import { CreateActionDto, EditActionDto, PublishActionDto } from './world.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('world')
export class WorldController {
  constructor(private readonly service: WorldService) {}

  // ===== HTML =====

  // Приватная страница "Мир" -> templates/world.html
  @UseGuards(JwtAuthGuard)
  @Get('view')
  @Render('world.html')
  async view(@CurrentUser() user: AuthUser) {
    const feed = await this.service.getWorld(user.userId);   // персональная лента
    const published = await this.service.getPublished();      // публичные опубликованные
    return { user, feed, published };
  }

  // Паршиал: персональная лента -> templates/partials/world_feed.html
  @UseGuards(JwtAuthGuard)
  @Get('partials/feed')
  @Render('partials/world_feed.html')
  async pFeed(@CurrentUser() user: AuthUser) {
    const feed = await this.service.getWorld(user.userId);
    return { feed };
  }

  // Паршиал: публичные опубликованные -> templates/partials/world_published.html
  @Get('partials/published')
  @Render('partials/world_published.html')
  async pPublished() {
    const actions = await this.service.getPublished();
    return { actions };
  }

  // ===== JSON API =====

  // личная лента (нужен userId)
  @UseGuards(JwtAuthGuard)
  @Get()
  getWorld(@CurrentUser() user: AuthUser) {
    return this.service.getWorld(user.userId);
  }

  // создание daily (пусть тоже будет под токеном)
  @UseGuards(JwtAuthGuard)
  @Post('daily')
  createDaily(@Body() dto: CreateActionDto) {
    return this.service.createDaily(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('draft')
  createDraft(@CurrentUser() user: AuthUser, @Body() dto: CreateActionDto) {
    return this.service.createDraft(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  edit(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: EditActionDto) {
    return this.service.editAction(user.userId, Number(id), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.deleteAction(user.userId, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post('publish/:id')
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: PublishActionDto) {
    return this.service.publishAction(user.userId, Number(id), dto);
  }

  // публичные списки
  @Get('published')
  getPublished() {
    return this.service.getPublished();
  }

  // отметка действия — под токеном (нужны userId/username)
  @UseGuards(JwtAuthGuard)
  @Post('mark/:id')
  mark(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.markAction(
      user.userId,
      Number(id),
      user.username ?? `user${user.userId}`,
    );
  }

  // публичный счётчик
  @Get('mark-counts')
  getMarkCounts() {
    return this.service.getMarkCounts();
  }
}
