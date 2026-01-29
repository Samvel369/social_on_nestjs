import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { getDisplayName } from '../../common/utils/user.utils';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rt: RealtimeGateway,
  ) {}

  async sendMessage(senderId: number, receiverId: number, content: string, replyToIds?: number[]) {
    const createData: any = { senderId, receiverId, content, isRead: false };

    if (replyToIds && replyToIds.length > 0) {
      createData.replyTo = { connect: replyToIds.map((id) => ({ id })) };
    }

    const msg = await this.prisma.message.create({
      data: createData,
      include: {
        replyTo: {
          select: { id: true, content: true, sender: { select: { id: true, username: true, firstName: true, lastName: true } } }
        }
      }
    });

    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    const senderName = sender ? getDisplayName(sender) : 'User';

    const repliesData = msg.replyTo.map(r => ({
      id: r.id,
      content: r.content,
      senderName: getDisplayName(r.sender)
    }));

    const eventData = {
      id: msg.id,
      senderId,
      receiverId,
      content,
      createdAt: msg.createdAt,
      isEdited: false,
      senderName,
      reactions: [],
      replyTo: repliesData
    };

    this.rt.emitData(receiverId, 'chat:new_message', eventData);
    this.rt.emitData(senderId, 'chat:new_message', eventData); 

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
      include: { 
        reactions: true,
        replyTo: {
          select: { id: true, content: true, sender: { select: { id: true, username: true, firstName: true, lastName: true } } }
        }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getContacts(userId: number) {
    // Получаем всех друзей одним запросом
    const requests = await this.prisma.friendRequest.findMany({
      where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
      include: { sender: true, receiver: true },
    });

    // Извлекаем ID всех друзей
    const friendIds = requests.map(r => r.senderId === userId ? r.receiver.id : r.sender.id);
    
    if (friendIds.length === 0) {
      return [];
    }

    // 🔥 ОПТИМИЗАЦИЯ: Получаем все непрочитанные сообщения одним запросом через groupBy
    const unreadMessages = await this.prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        senderId: { in: friendIds },
        isRead: false,
        deletedForReceiver: false,
      },
      _count: { id: true },
    });

    // Создаем Map для быстрого доступа к количеству непрочитанных
    const unreadCountMap = new Map<number, number>();
    unreadMessages.forEach(item => {
      unreadCountMap.set(item.senderId, item._count.id);
    });

    // 🔥 ОПТИМИЗАЦИЯ: Получаем все последние сообщения одним запросом
    // Получаем все сообщения между пользователем и всеми друзьями, затем обрабатываем в памяти
    const allMessages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: friendIds } },
          { receiverId: userId, senderId: { in: friendIds }, deletedForReceiver: false },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Создаем Map для последних сообщений (берем самое свежее для каждой пары)
    const lastMessageMap = new Map<number, { content: string; createdAt: Date }>();
    const processedPairs = new Set<string>();

    for (const msg of allMessages) {
      const friendId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const pairKey = `${Math.min(userId, friendId)}-${Math.max(userId, friendId)}`;
      
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        lastMessageMap.set(friendId, {
          content: msg.content,
          createdAt: msg.createdAt,
        });
      }
    }

    // Формируем результат
    const contacts = requests.map(r => {
      const friend = r.senderId === userId ? r.receiver : r.sender;
      const unreadCount = unreadCountMap.get(friend.id) || 0;
      const lastMsg = lastMessageMap.get(friend.id);

      return {
        id: friend.id,
        username: getDisplayName(friend),
        avatar_url: friend.avatarUrl || '/static/default-avatar.png',
        unreadCount,
        lastMessage: lastMsg ? lastMsg.content : null,
        lastMessageTime: lastMsg ? lastMsg.createdAt : null,
      };
    });

    // Сортируем по времени последнего сообщения
    return contacts.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
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

  // 🔥 ИСПРАВЛЕННЫЙ МЕТОД РЕДАКТИРОВАНИЯ
  async editMessage(userId: number, messageId: number, newContent: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();
    if (msg.senderId !== userId) throw new ForbiddenException();

    // 🔥 ПРОВЕРКА: Если текст не изменился - ничего не делаем
    if (msg.content === newContent) {
        return { ok: true, noChange: true };
    }

    await this.prisma.message.update({ 
        where: { id: messageId }, 
        data: { content: newContent, isEdited: true } 
    });

    const updated = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: { 
          reactions: true,
          replyTo: {
            select: { id: true, content: true, sender: { select: { id: true, username: true, firstName: true, lastName: true } } }
          }
        }
    });

    const eventData = { 
        id: messageId, 
        content: newContent, 
        isEdited: true, 
        reactions: updated?.reactions || [],
        replyTo: updated?.replyTo?.map(r => ({ id: r.id, content: r.content, senderName: getDisplayName(r.sender) })) || []
    };
    
    this.rt.emitData(msg.receiverId, 'chat:message_updated', eventData);
    this.rt.emitData(msg.senderId, 'chat:message_updated', eventData);
    return { ok: true };
  }

  async deleteMessage(userId: number, messageId: number) {
    return this.deleteMessagesBulk(userId, [messageId]);
  }

  async deleteMessagesBulk(userId: number, messageIds: number[]) {
    const messages = await this.prisma.message.findMany({ where: { id: { in: messageIds } } });
    const toDeleteIds: number[] = [];
    const toHideIds: number[] = [];

    for (const msg of messages) {
      if (msg.senderId === userId) toDeleteIds.push(msg.id);
      else if (msg.receiverId === userId) toHideIds.push(msg.id);
    }

    if (toDeleteIds.length > 0) {
      await this.prisma.message.deleteMany({ where: { id: { in: toDeleteIds } } });
      for (const msg of messages) {
         if (toDeleteIds.includes(msg.id)) {
             this.rt.emitData(msg.receiverId, 'chat:message_deleted', { id: msg.id });
             this.rt.emitData(msg.senderId, 'chat:message_deleted', { id: msg.id });
         }
      }
    }

    if (toHideIds.length > 0) {
      await this.prisma.message.updateMany({ where: { id: { in: toHideIds } }, data: { deletedForReceiver: true } });
      toHideIds.forEach(id => this.rt.emitData(userId, 'chat:message_deleted', { id }));
    }
    return { ok: true };
  }

  async toggleReaction(userId: number, messageId: number, emoji: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();

    const existing = await this.prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } }
    });

    if (existing) await this.prisma.messageReaction.delete({ where: { id: existing.id } });
    else await this.prisma.messageReaction.create({ data: { messageId, userId, emoji } });

    const allReactions = await this.prisma.messageReaction.findMany({ where: { messageId } });
    const eventData = { id: messageId, reactions: allReactions };
    this.rt.emitData(msg.senderId, 'chat:reaction_updated', eventData);
    this.rt.emitData(msg.receiverId, 'chat:reaction_updated', eventData);
    return { ok: true };
  }
}