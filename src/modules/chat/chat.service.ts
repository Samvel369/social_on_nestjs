import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rt: RealtimeGateway,
  ) {}

  async sendMessage(senderId: number, receiverId: number, content: string) {
    const msg = await this.prisma.message.create({
      data: { senderId, receiverId, content, isRead: false },
    });

    const eventData = {
      id: msg.id,
      senderId,
      content,
      createdAt: msg.createdAt,
      isEdited: false,
      senderName: (await this.prisma.user.findUnique({ where: { id: senderId } }))?.username || 'User',
      reactions: [] // Сразу отправляем пустой массив реакций
    };

    this.rt.emitData(receiverId, 'chat:new_message', eventData);

    return msg;
  }

  async getHistory(userId1: number, userId2: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1, deletedForReceiver: false },
        ],
      },
      include: { reactions: true }, // 🔥 Подгружаем реакции
      orderBy: { createdAt: 'asc' },
    });
  }

  async getContacts(userId: number) {
    const requests = await this.prisma.friendRequest.findMany({
      where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
      include: { sender: true, receiver: true },
    });

    const unreadCounts = await this.prisma.message.groupBy({
      by: ['senderId'],
      where: { receiverId: userId, isRead: false, deletedForReceiver: false },
      _count: { id: true },
    });

    const unreadMap: Record<number, number> = {};
    unreadCounts.forEach((u) => { unreadMap[u.senderId] = u._count.id; });

    return requests.map((r) => {
      const friend = r.senderId === userId ? r.receiver : r.sender;
      return {
        id: friend.id,
        username: friend.username,
        avatar_url: friend.avatarUrl || '/static/default-avatar.png',
        unreadCount: unreadMap[friend.id] || 0,
      };
    });
  }

  async markAsRead(userId: number, friendId: number) {
    await this.prisma.message.updateMany({
      where: { receiverId: userId, senderId: friendId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async getUnreadCount(userId: number) {
    const unreadGroups = await this.prisma.message.findMany({
      where: { receiverId: userId, isRead: false, deletedForReceiver: false },
      distinct: ['senderId'],
      select: { senderId: true },
    });
    return unreadGroups.length;
  }

  async editMessage(userId: number, messageId: number, newContent: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();
    if (msg.senderId !== userId) throw new ForbiddenException('Нельзя редактировать чужие сообщения');

    await this.prisma.message.update({
      where: { id: messageId },
      data: { content: newContent, isEdited: true },
    });

    // При редактировании реакции не меняются, но можно их подгрузить на всякий случай
    const updatedWithReactions = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: { reactions: true }
    });

    const eventData = { 
        id: messageId, 
        content: newContent, 
        isEdited: true, 
        reactions: updatedWithReactions?.reactions || [] 
    };
    
    this.rt.emitData(msg.receiverId, 'chat:message_updated', eventData);
    this.rt.emitData(msg.senderId, 'chat:message_updated', eventData);

    return { ok: true };
  }

  async deleteMessage(userId: number, messageId: number) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();

    if (msg.senderId === userId) {
      await this.prisma.message.delete({ where: { id: messageId } });
      this.rt.emitData(msg.receiverId, 'chat:message_deleted', { id: messageId });
      this.rt.emitData(msg.senderId, 'chat:message_deleted', { id: messageId });
    } else if (msg.receiverId === userId) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedForReceiver: true },
      });
      this.rt.emitData(userId, 'chat:message_deleted', { id: messageId });
    } else {
      throw new ForbiddenException();
    }
    return { ok: true };
  }

  // 🔥 НОВЫЙ МЕТОД: ЛАЙКИ / РЕАКЦИИ 🔥
  async toggleReaction(userId: number, messageId: number, emoji: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();

    // Проверяем, есть ли уже такая реакция от этого юзера
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji }
      }
    });

    if (existing) {
      // Если есть — удаляем (Toggle OFF)
      await this.prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      // Если нет — создаем (Toggle ON)
      await this.prisma.messageReaction.create({
        data: { messageId, userId, emoji }
      });
    }

    // Получаем актуальный список всех реакций для этого сообщения
    const allReactions = await this.prisma.messageReaction.findMany({
      where: { messageId }
    });

    // Отправляем событие обновления
    const eventData = { id: messageId, reactions: allReactions };
    this.rt.emitData(msg.senderId, 'chat:reaction_updated', eventData);
    this.rt.emitData(msg.receiverId, 'chat:reaction_updated', eventData);

    return { ok: true };
  }
}