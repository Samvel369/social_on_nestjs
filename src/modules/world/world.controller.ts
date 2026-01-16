import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Render,
} from '@nestjs/common';
import { WorldService } from './world.service';
import { PrismaService } from '../../prisma/prisma.service'; // 🔥
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

function getDisplayName(user: any) {
  if (user.firstName) {
    return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
  }
  return user.username;
}

@Controller('world')
export class WorldController {
  constructor(
    private readonly service: WorldService,
    private readonly prisma: PrismaService // 🔥
  ) {}

  // ===== HTML =====
  @UseGuards(JwtAuthGuard)
  @Get('view')
  @Render('world.html')
  async view(@CurrentUser() user: AuthUser) {
    // 🔥 Формируем правильное имя
    const me = await this.prisma.user.findUnique({ where: { id: user.userId } });

    const current_user = me ? {
      id: me.id,
      username: getDisplayName(me),
      avatar_url: me.avatarUrl ?? '',
    } : null;

    const daily_actions: any[] = [];
    const published: any[] = [];
    const drafts: any[] = [];

    return {
      current_user,
      daily_actions,
      published,
      drafts,
    };
  }

  // ===== JSON API =====
  @UseGuards(JwtAuthGuard)
  @Post('mark/:id')
  async mark(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.markAction(
      user.userId,
      Number(id),
      user.username ?? `user${user.userId}`,
    );
  }

  @Get('mark-counts')
  getMarkCounts() {
    return this.service.getMarkCounts();
  }
}