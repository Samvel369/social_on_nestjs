import { Injectable } from '@nestjs/common';
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

    this.rt.emitData(receiverId, 'chat:new_message', {
      id: msg.id,
      senderId,
      content,
      createdAt: msg.createdAt,
      senderName: (await this.prisma.user.findUnique({where: {id: senderId}}))?.username || 'User'
    });

    return msg;
  }

  async getHistory(userId1: number, userId2: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 🔥 ОБНОВЛЕННЫЙ МЕТОД: Добавляем подсчет непрочитанных для каждого друга
  async getContacts(userId: number) {
    // 1. Получаем список друзей
    const requests = await this.prisma.friendRequest.findMany({
      where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
      include: { sender: true, receiver: true },
    });

    // 2. Считаем непрочитанные сообщения, сгруппированные по отправителю
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['senderId'],
      where: { receiverId: userId, isRead: false },
      _count: { id: true },
    });

    // Превращаем массив в удобный словарь: { id_отправителя: кол-во_сообщений }
    const unreadMap: Record<number, number> = {};
    unreadCounts.forEach((u) => {
      unreadMap[u.senderId] = u._count.id;
    });

    // 3. Собираем итоговый список
    return requests.map((r) => {
      const friend = r.senderId === userId ? r.receiver : r.sender;
      return {
        id: friend.id,
        username: friend.username,
        avatar_url: friend.avatarUrl || '/static/default-avatar.png',
        unreadCount: unreadMap[friend.id] || 0, // Вставляем цифру или 0
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
      where: { receiverId: userId, isRead: false },
      distinct: ['senderId'],
      select: { senderId: true },
    });
    return unreadGroups.length;
  }
}