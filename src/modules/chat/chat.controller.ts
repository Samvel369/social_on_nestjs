import { 
  Controller, Get, Post, Body, Param, ParseIntPipe, Render, UseGuards, Put, Delete 
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from '../../prisma/prisma.service'; // 🔥 Добавили
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Хелпер
function getDisplayName(user: any) {
  if (user.firstName) {
    return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
  }
  return user.username;
}

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly service: ChatService,
    private readonly prisma: PrismaService // 🔥 Инжектим
  ) {}

  @Get()
  @Render('chat.html')
  async viewChat(@CurrentUser() user: { userId: number }) {
    // 🔥 Достаем полные данные пользователя для меню
    const me = await this.prisma.user.findUnique({ where: { id: user.userId } });
    
    const current_user = me ? {
      id: me.id,
      userId: me.id,
      username: getDisplayName(me), // Красивое имя
      avatar_url: me.avatarUrl ?? '',
    } : null;

    return {
      user, // Оставляем для совместимости (если где-то используется user.userId)
      current_user, // Для base.html (меню)
      contacts: await this.service.getContacts(user.userId),
    };
  }

  @Get('history/:friendId')
  async getHistory(@CurrentUser() user: { userId: number }, @Param('friendId', ParseIntPipe) friendId: number) {
    return this.service.getHistory(user.userId, friendId);
  }

  @Post('send')
  async sendMessage(@CurrentUser() user: { userId: number }, @Body() body: { receiverId: number; content: string }) {
    if (!body.content?.trim()) return { error: 'Empty message' };
    return this.service.sendMessage(user.userId, body.receiverId, body.content);
  }

  @Post('mark-read/:friendId')
  async markRead(@CurrentUser() user: { userId: number }, @Param('friendId', ParseIntPipe) friendId: number) {
    return this.service.markAsRead(user.userId, friendId);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: { userId: number }) {
    const count = await this.service.getUnreadCount(user.userId);
    return { count };
  }

  @Put(':id')
  async editMessage(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { content: string }
  ) {
    return this.service.editMessage(user.userId, id, body.content);
  }

  @Delete(':id')
  async deleteMessage(@CurrentUser() user: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteMessage(user.userId, id);
  }

  @Post(':id/react')
  async react(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { emoji: string }
  ) {
    return this.service.toggleReaction(user.userId, id, body.emoji);
  }
}