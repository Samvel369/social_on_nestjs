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
import { EventsService } from './events.service';
import { PrismaService } from '../../prisma/prisma.service'; // 🔥
import { CreateActionDto, PublishActionDto, DeleteActionDto } from './events.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { getDisplayName } from '../../common/utils/user.utils';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(
    private readonly service: EventsService,
    private readonly prisma: PrismaService // 🔥
  ) { }

  // HTML
  @Get('view')
  @Render('events.html')
  async view(@CurrentUser() user: AuthUser) {
    // 🔥 Формируем current_user с именем
    const me = await this.prisma.user.findUnique({ where: { id: user.userId } });

    const current_user = me ? {
      id: me.id,
      userId: me.id,
      username: getDisplayName(me),
      avatar_url: me.avatarUrl ?? '',
    } : null;

    const [drafts, published] = await Promise.all([
      this.service.getDrafts(user.userId),
      this.service.getPublished(user.userId),
    ]);

    return { current_user, drafts, published };
  }

  // JSON
  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const [drafts, published] = await Promise.all([
      this.service.getDrafts(user.userId),
      this.service.getPublished(user.userId),
    ]);
    return { drafts, published };
  }

  @Post('new')
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateActionDto) {
    const action = await this.service.createDraft(user.userId, dto);
    return { ok: true, action };
  }

  @Post('publish')
  async publish(@CurrentUser() user: AuthUser, @Body() dto: PublishActionDto) {
    await this.service.publishAction(user.userId, dto);
    return { ok: true };
  }

  @Post('delete')
  async deleteBody(@CurrentUser() user: AuthUser, @Body() dto: DeleteActionDto) {
    await this.service.deleteAction(user.userId, dto.id);
    return { ok: true };
  }

  @Post('delete/:id')
  async deleteByPost(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteAction(user.userId, id);
    return { ok: true };
  }

  @Delete('delete/:id')
  async deleteByDelete(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteAction(user.userId, id);
    return { ok: true };
  }
}