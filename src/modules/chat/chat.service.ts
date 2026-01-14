import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rt: RealtimeGateway, //
  ) {}

  async sendMessage(senderId: number, receiverId: number, content: string) {
    const msg = await this.prisma.message.create({
      data: { senderId, receiverId, content, isRead: false },
    });

    this.rt.emitData(receiverId, 'chat:new_message', {
      id: msg.id,
      senderId,
      content,
      createdAt: msg.createdAt,
      isEdited: false,
      senderName: (await this.prisma.user.findUnique({where: {id: senderId}}))?.username || 'User'
    });

    return msg;
  }

  async getHistory(userId1: number, userId2: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          // Если я отправитель - вижу всё (свои я удаляю полностью)
          { senderId: userId1, receiverId: userId2 },
          // Если я получатель - вижу только те, что НЕ удалил для себя
          { senderId: userId2, receiverId: userId1, deletedForReceiver: false },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getContacts(userId: number) {
    const requests = await this.prisma.friendRequest.findMany({
      where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
      include: { sender: true, receiver: true },
    });

    // Считаем только те, которые я не удалил для себя
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['senderId'],
      where: { receiverId: userId, isRead: false, deletedForReceiver: false },
      _count: { id: true },
    });

    const unreadMap: Record<number, number> = {};
    unreadCounts.forEach((u) => {
      unreadMap[u.senderId] = u._count.id;
    });

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

  // ... (методы markAsRead и getUnreadCount оставляем без изменений, но добавь фильтр deletedForReceiver: false) ...
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


  // 🔥 НОВЫЕ МЕТОДЫ (Edit / Delete) 🔥

  async editMessage(userId: number, messageId: number, newContent: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();

    // Редактировать можно только СВОИ сообщения
    if (msg.senderId !== userId) throw new ForbiddenException('Нельзя редактировать чужие сообщения');

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { content: newContent, isEdited: true },
    });

    // Уведомляем обоих участников, что текст изменился
    const eventData = { id: messageId, content: newContent, isEdited: true };
    this.rt.emitData(msg.receiverId, 'chat:message_updated', eventData); // Собеседнику
    this.rt.emitData(msg.senderId, 'chat:message_updated', eventData);   // Себе (для обновления UI)

    return updated;
  }

  async deleteMessage(userId: number, messageId: number) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();

    // ЛОГИКА УДАЛЕНИЯ
    if (msg.senderId === userId) {
      // 1. Это МОЁ сообщение -> Удаляем полностью (Unsend)
      await this.prisma.message.delete({ where: { id: messageId } });

      // Сообщаем всем, чтобы удалить из DOM
      this.rt.emitData(msg.receiverId, 'chat:message_deleted', { id: messageId });
      this.rt.emitData(msg.senderId, 'chat:message_deleted', { id: messageId });
      
    } else if (msg.receiverId === userId) {
      // 2. Это ЧУЖОЕ сообщение -> Скрываем только у меня
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedForReceiver: true },
      });

      // Сообщаем ТОЛЬКО мне (чтобы оно исчезло с экрана)
      this.rt.emitData(userId, 'chat:message_deleted', { id: messageId });
    } else {
      throw new ForbiddenException();
    }

    return { ok: true };
  }
}