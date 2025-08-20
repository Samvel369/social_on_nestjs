import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

type FriendStatus = 'pending' | 'accepted';

@Injectable()
export class FriendsService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  // === helpers ===
  private async areFriends(a: number, b: number) {
    const fr = await this.prisma.friendRequest.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { senderId: a, receiverId: b },
          { senderId: b, receiverId: a },
        ],
      },
      select: { id: true },
    });
    return !!fr;
  }

  private truthy(v?: string) {
    return v === '1' || v === 'true' || v === 'True' || v === 'on';
  }

  // ===== /friends (GET)  — данные для страницы друзей (+ possible friends) =====
  async friendsPage(userId: number, minutesFromSession = 10) {
    // принятые друзья (accepted в обе стороны)
    const friendsAccepted = await this.prisma.friendRequest.findMany({
      where: { status: 'accepted', OR: [{ senderId: userId }, { receiverId: userId }] },
      include: { sender: true, receiver: true },
    });
    const friends = friendsAccepted.map(fr => fr.senderId === userId ? fr.receiver : fr.sender);

    // входящие/исходящие pending
    const incomingRequests = await this.prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'pending' },
      orderBy: { id: 'desc' },
      include: { sender: true },
    });
    const outgoingRequests = await this.prisma.friendRequest.findMany({
      where: { senderId: userId, status: 'pending' },
      orderBy: { id: 'desc' },
      include: { receiver: true },
    });

    // пользователи, отметившиеся на моих действиях
    const myActions = await this.prisma.action.findMany({ where: { userId }, select: { id: true } });
    const actionIds = myActions.map(a => a.id);
    let markedUserIds: number[] = [];
    if (actionIds.length) {
      const marks = await this.prisma.actionMark.findMany({
        where: { actionId: { in: actionIds }, userId: { not: userId } },
        distinct: ['userId'],
        select: { userId: true },
      });
      markedUserIds = marks.map(m => m.userId);
    }

    // подписчики (у кого ownerId = userId)
    const subscribers = await this.prisma.user.findMany({
      where: { subscribers: { some: { ownerId: userId } } },
    });

    // мои подписки
    const subscriptions = await this.prisma.user.findMany({
      where: { owners: { some: { subscriberId: userId } } },
    });

    // исключения (сам, заявки, друзья, подписчики)
    const excludeIds = new Set<number>([
      userId,
      ...incomingRequests.map(r => r.senderId),
      ...outgoingRequests.map(r => r.receiverId),
      ...friends.map(f => f.id),
      ...subscribers.map(s => s.id),
    ]);

    // фильтр по "свежести" кандидатов из PotentialFriendView
    const cutoff = new Date(Date.now() - minutesFromSession * 60 * 1000);
    const recentCandidateRows = await this.prisma.potentialFriendView.findMany({
      where: { viewerId: userId, timestamp: { gte: cutoff } },
      select: { userId: true },
    });
    const recentIds = new Set(recentCandidateRows.map(r => r.userId));

    // possible friends = отмечались, не в исключениях, и есть в recentIds
    const possibleIds = markedUserIds.filter(id => !excludeIds.has(id) && recentIds.has(id));
    const users = possibleIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: possibleIds } } })
      : [];

    return {
      users, friends, incoming_requests: incomingRequests,
      outgoing_requests: outgoingRequests, subscribers, subscriptions,
      cleanup_time: minutesFromSession,
    };
  }

  // ===== partials =====
  private async _collectFriendsPageData(userId: number) {
    const incoming = await this.prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'pending' },
      orderBy: { id: 'desc' },
    });
    const outgoing = await this.prisma.friendRequest.findMany({
      where: { senderId: userId, status: 'pending' },
      orderBy: { id: 'desc' },
    });
    const accepted = await this.prisma.friendRequest.findMany({
      where: { status: 'accepted', OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    const friendIds = accepted.map(fr => fr.senderId === userId ? fr.receiverId : fr.senderId);
    const friends = friendIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: friendIds } } })
      : [];

    const subscribers = await this.prisma.user.findMany({
      where: { subscribers: { some: { ownerId: userId } } },
    });
    const subscriptions = await this.prisma.user.findMany({
      where: { owners: { some: { subscriberId: userId } } },
    });

    return { incoming, outgoing, friends, subscribers, subscriptions };
  }

  async partialIncoming(userId: number) {
    const { incoming } = await this._collectFriendsPageData(userId);
    return { incoming_requests: incoming };
  }
  async partialOutgoing(userId: number) {
    const { outgoing } = await this._collectFriendsPageData(userId);
    return { outgoing_requests: outgoing };
  }
  async partialFriends(userId: number) {
    const { friends } = await this._collectFriendsPageData(userId);
    return { friends };
  }
  async partialSubscribers(userId: number) {
    const { subscribers } = await this._collectFriendsPageData(userId);
    return { subscribers };
  }
  async partialSubscriptions(userId: number) {
    const { subscriptions } = await this._collectFriendsPageData(userId);
    return { subscriptions };
  }

  // ===== POST /send_friend_request/:userId =====
  async sendFriendRequest(targetId: number, me: number, meUsername: string) {
    if (me === targetId) throw new BadRequestException('Нельзя добавить в друзья самого себя');

    // уже друзья?
    if (await this.areFriends(me, targetId)) {
      return { ok: true, message: 'Вы уже друзья' };
    }

    // есть PENDING в любом направлении?
    const pending = await this.prisma.friendRequest.findFirst({
      where: {
        status: 'pending',
        OR: [
          { senderId: me, receiverId: targetId },
          { senderId: targetId, receiverId: me },
        ],
      },
    });
    if (pending) {
      return { ok: true, message: 'Заявка уже существует', data: { request_id: pending.id } };
    }

    // создать PENDING
    const fr = await this.prisma.friendRequest.create({
      data: { senderId: me, receiverId: targetId, status: 'pending' as FriendStatus },
    });

    // убрать возможного друга из списка отправителя
    await this.prisma.potentialFriendView.deleteMany({
      where: { viewerId: me, userId: targetId },
    });

    // уведомить получателя
    const sender = await this.prisma.user.findUnique({ where: { id: me } });
    this.rt.emitToLegacyUserRoom(targetId, 'friend_request_sent', {
      request_id: fr.id,
      sender_id: me,
      sender_username: meUsername ?? sender?.username,
      sender_avatar: sender?.avatarUrl ?? null,
    });

    return { ok: true, message: 'Заявка отправлена', data: { request_id: fr.id } };
  }

  // ===== POST /cancel_friend_request/:requestId =====
  async cancelFriendRequest(requestId: number, me: number, subscribeFlag: string | undefined) {
    const fr = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!fr) throw new BadRequestException('Заявка не найдена');
    if (me !== fr.senderId && me !== fr.receiverId) throw new ForbiddenException();

    const senderId = fr.senderId;
    const receiverId = fr.receiverId;

    // если получатель отклоняет и "оставить в подписчиках"
    if (this.truthy(subscribeFlag) && me === receiverId) {
      const exists = await this.prisma.subscriber.findFirst({
        where: { subscriberId: senderId, ownerId: receiverId },
      });
      if (!exists) {
        await this.prisma.subscriber.create({ data: { subscriberId: senderId, ownerId: receiverId } });
      }

      const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
      const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });

      // владельцу: новый подписчик
      this.rt.emitToLegacyUserRoom(receiverId, 'new_subscriber', {
        subscriber_id: senderId,
        subscriber_username: sender?.username,
        subscriber_avatar: sender?.avatarUrl ?? null,
      });
      // подписчику: он подписан на receiver
      this.rt.emitToLegacyUserRoom(senderId, 'subscribed_to', {
        user_id: receiverId,
        username: receiver?.username,
        avatar: receiver?.avatarUrl ?? null,
      });
    }

    await this.prisma.friendRequest.delete({ where: { id: requestId } });

    // обеим сторонам — убрать заявку без F5
    this.rt.emitToLegacyUserRoom(senderId, 'friend_request_cancelled', { request_id: requestId });
    this.rt.emitToLegacyUserRoom(receiverId, 'friend_request_cancelled', { request_id: requestId });

    return { ok: true, message: 'Заявка отменена' };
  }

  // ===== POST /accept_friend_request/:requestId =====
  async acceptFriendRequest(requestId: number, me: number) {
    const fr = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!fr) throw new BadRequestException('Заявка не найдена');
    if (fr.receiverId !== me) throw new ForbiddenException();
    if (fr.status !== 'pending') return { ok: true, message: 'Уже обработано' };

    await this.prisma.friendRequest.update({
      where: { id: fr.id },
      data: { status: 'accepted' },
    });

    // удалить подписки в обе стороны
    await this.prisma.subscriber.deleteMany({
      where: {
        OR: [
          { ownerId: fr.senderId, subscriberId: fr.receiverId },
          { ownerId: fr.receiverId, subscriberId: fr.senderId },
        ],
      },
    });

    // уведомления
    this.rt.emitToLegacyUserRoom(fr.senderId, 'friend_accepted', { request_id: fr.id });
    this.rt.emitToLegacyUserRoom(fr.receiverId, 'friend_accepted', { request_id: fr.id });

    // освежить подписочные секции
    this.rt.emitToLegacyUserRoom(fr.senderId, 'subscribers_refresh', {});
    this.rt.emitToLegacyUserRoom(fr.receiverId, 'subscribers_refresh', {});

    // убрать possible friends в обе стороны
    await this.prisma.potentialFriendView.deleteMany({
      where: {
        OR: [
          { viewerId: fr.senderId, userId: fr.receiverId },
          { viewerId: fr.receiverId, userId: fr.senderId },
        ],
      },
    });

    return { ok: true, message: 'Заявка принята' };
  }

  // ===== POST /remove_friend/:userId =====
  async removeFriend(targetId: number, me: number) {
    const fr = await this.prisma.friendRequest.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { senderId: me, receiverId: targetId },
          { senderId: targetId, receiverId: me },
        ],
      },
    });
    if (fr) {
      await this.prisma.friendRequest.delete({ where: { id: fr.id } });
      this.rt.emitToLegacyUserRoom(targetId, 'friend_removed', { user_id: me });
    }
    return { ok: true, message: 'Удалено из друзей' };
  }

  // ===== POST /remove_possible_friend/:userId =====
  async removePossibleFriend(targetId: number, me: number) {
    // Если у тебя есть M2M ignoredUsers — можно добавить туда. Минимально — чистим PFV:
    await this.prisma.potentialFriendView.deleteMany({
      where: { viewerId: me, userId: targetId },
    });
    return { ok: true };
  }

  // ===== POST /subscribe/:userId =====
  async subscribe(targetId: number, me: number, meUsername: string) {
    if (me === targetId) throw new BadRequestException('Нельзя подписаться на себя');

    const exists = await this.prisma.subscriber.findFirst({
      where: { subscriberId: me, ownerId: targetId },
    });
    if (exists) return { ok: true, message: 'Уже подписаны' };

    if (await this.areFriends(me, targetId)) {
      throw new BadRequestException('Вы уже друзья — подписка не нужна');
    }

    await this.prisma.subscriber.create({ data: { subscriberId: me, ownerId: targetId } });

    const meUser = await this.prisma.user.findUnique({ where: { id: me } });
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetId } });

    this.rt.emitToLegacyUserRoom(targetId, 'new_subscriber', {
      subscriber_id: me,
      subscriber_username: meUsername ?? meUser?.username,
      subscriber_avatar: meUser?.avatarUrl ?? null,
    });
    this.rt.emitToLegacyUserRoom(me, 'subscribed_to', {
      user_id: targetId,
      username: targetUser?.username,
      avatar: targetUser?.avatarUrl ?? null,
    });

    return { ok: true, message: 'Подписка оформлена' };
  }

  // ===== POST /cleanup_potential_friends =====
  async cleanupPotentialFriends(minutes: number, me: number) {
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    await this.prisma.potentialFriendView.deleteMany({
      where: { viewerId: me, timestamp: { lt: threshold } },
    });
    return { ok: true };
  }

  // ===== POST /leave_in_subscribers/:userId =====
  async leaveInSubscribers(targetId: number, me: number) {
    if (targetId === me) return { ok: true };
    const exists = await this.prisma.subscriber.findFirst({
      where: { subscriberId: targetId, ownerId: me },
    });
    if (!exists) {
      await this.prisma.subscriber.create({ data: { subscriberId: targetId, ownerId: me } });
    }
    return { ok: true };
  }
}
