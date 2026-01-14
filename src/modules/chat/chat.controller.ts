import { 
  Controller, Get, Post, Body, Param, ParseIntPipe, Render, UseGuards, Put, Delete 
} from '@nestjs/common';
import { ChatService } from './chat.service'; //
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get()
  @Render('chat.html')
  async viewChat(@CurrentUser() user: { userId: number }) {
    return {
      user,
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

  // 🔥 EDIT
  @Put(':id')
  async editMessage(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { content: string }
  ) {
    return this.service.editMessage(user.userId, id, body.content);
  }

  // 🔥 DELETE
  @Delete(':id')
  async deleteMessage(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.service.deleteMessage(user.userId, id);
  }
}