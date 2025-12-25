import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
import { FriendRequestStatus } from '@prisma/client';

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rt: RealtimeGateway,
  ) {}

  // ---------- helpers ----------
  private mapUser(u: { id: number; username: string; avatarUrl: string | null }) {
    return { id: u.id, username: u.username, avatar_url: u.avatarUrl ?? '' };
  }
  private notifyOne(userId: number, event: string) { try { this.rt.emitToUser(userId, event); } catch {} }
  private notifyBoth(a: number, b: number, event: string) { try { this.rt.emitToUsers([a, b], event); } catch {} }
  private async assertUserExists(userId: number) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!u) throw new NotFoundException('user not found');
  }
  private isUniqueError(e: any) { return e && typeof e === 'object' && e.code === 'P2002'; }
  private async cleanupSubscriptionsBetween(a: number, b: number) {
    await this.prisma.subscriber.deleteMany({ where: { OR: [
      { subscriberId: a, ownerId: b }, { subscriberId: b, ownerId: a },
    ]}});
  }
  private async cleanupPotentialBetween(a: number, b: number) {
    await this.prisma.potentialFriendView.deleteMany({ where: { OR: [
      { viewerId: a, userId: b }, { viewerId: b, userId: a },
    ]}});
  }

  // ---------- reads ----------
  async getPossible(viewerId: number, keepMinutes = 10) {
    const since = new Date(Date.now() - keepMinutes * 60_000);
    const rows = await this.prisma.potentialFriendView.findMany({
      where: { viewerId, timestamp: { gte: since } },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { timestamp: 'desc' },
    });

    // 🔥 ИСПРАВЛЕНИЕ: Теперь мы отдаем объект с timestamp!
    return rows.map(r => ({
      ...this.mapUser(r.user), // id, username, avatar_url
      timestamp: r.timestamp   // добавляем дату, чтобы JS мог считать таймер
    }));
  }

  async getIncoming(userId: number) {
    const rows = await this.prisma.friendRequest.findMany({
      where: { receiverId: userId, status: FriendRequestStatus.PENDING },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { id: 'desc' },
    });
    return rows.map(r => ({ id: r.id, sender: this.mapUser(r.sender) }));
  }

  async getOutgoing(userId: number) {
    const rows = await this.prisma.friendRequest.findMany({
      where: { senderId: userId, status: FriendRequestStatus.PENDING },
      include: { receiver: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { id: 'desc' },
    });
    return rows.map(r => ({ id: r.id, receiver: this.mapUser(r.receiver) }));
  }

  async getFriends(userId: number) {
    const rows = await this.prisma.friendRequest.findMany({
      where: { status: FriendRequestStatus.ACCEPTED, OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { id: 'desc' },
    });
    return rows.map(r => this.mapUser(r.senderId === userId ? r.receiver : r.sender));
  }

  async getSubscribers(userId: number) {
    const rows = await this.prisma.subscriber.findMany({
      where: { ownerId: userId },
      include: { subscriber: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { id: 'desc' },
    });
    return rows.map(r => this.mapUser(r.subscriber));
  }

  async getSubscriptions(userId: number) {
    const rows = await this.prisma.subscriber.findMany({
      where: { subscriberId: userId },
      include: { owner: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { id: 'desc' },
    });
    return rows.map(r => this.mapUser(r.owner));
  }

  // ---------- actions (idempotent) ----------
  async sendFriendRequest(userId: number, toUserId: number) {
    if (userId === toUserId) throw new BadRequestException('self request');
    await this.assertUserExists(toUserId);

    const existing = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: toUserId },
          { senderId: toUserId, receiverId: userId },
        ],
        status: { in: [FriendRequestStatus.PENDING, FriendRequestStatus.ACCEPTED] },
      },
      select: { id: true, senderId: true, receiverId: true, status: true },
    });

    if (existing) {
      if (existing.status === FriendRequestStatus.ACCEPTED) {
        this.notifyBoth(userId, toUserId, 'friends:lists:refresh');
        return { ok: true, alreadyFriends: true };
      }
      if (existing.senderId === userId) {
        this.notifyBoth(userId, toUserId, 'friends:lists:refresh');
        return { ok: true, duplicatePending: true };
      }
      await this.prisma.friendRequest.update({ where: { id: existing.id }, data: { status: FriendRequestStatus.ACCEPTED } });
      await this.cleanupSubscriptionsBetween(userId, toUserId);
      await this.cleanupPotentialBetween(userId, toUserId);
      this.notifyBoth(userId, toUserId, 'friends:lists:refresh');
      return { ok: true, autoAccepted: true };
    }

    try {
      await this.prisma.friendRequest.create({
        data: { senderId: userId, receiverId: toUserId, status: FriendRequestStatus.PENDING },
      });
    } catch (e: any) {
      if (!this.isUniqueError(e)) throw e;
    }

    this.notifyBoth(userId, toUserId, 'friends:lists:refresh');
    return { ok: true };
  }

  async acceptFriendRequest(userId: number, requestId: number) {
    const fr = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
      select: { id: true, senderId: true, receiverId: true, status: true },
    });
    if (!fr) return { ok: true };
    if (fr.receiverId !== userId) throw new ForbiddenException('not your request');

    if (fr.status === FriendRequestStatus.PENDING) {
      await this.prisma.friendRequest.update({ where: { id: requestId }, data: { status: FriendRequestStatus.ACCEPTED } });
      await this.cleanupSubscriptionsBetween(fr.senderId, fr.receiverId);
      await this.cleanupPotentialBetween(fr.senderId, fr.receiverId);
    }
    this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
    return { ok: true };
  }

  async cancelFriendRequest(userId: number, requestId: number, subscribe = false) {
    const fr = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
      select: { id: true, senderId: true, receiverId: true, status: true },
    });
    if (!fr) return { ok: true };
    if (fr.senderId !== userId) throw new ForbiddenException('not your request');

    if (fr.status === FriendRequestStatus.PENDING) {
      await this.prisma.friendRequest.delete({ where: { id: requestId } });
      if (subscribe) {
        try { await this.prisma.subscriber.create({ data: { subscriberId: userId, ownerId: fr.receiverId } }); }
        catch (e: any) { if (!this.isUniqueError(e)) throw e; }
      }
      this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
      return { ok: true };
    }
    this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
    return { ok: true };
  }

  async leaveAsSubscriber(userId: number, requestId: number) {
    const fr = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
      select: { id: true, senderId: true, receiverId: true, status: true },
    });
    if (!fr) return { ok: true };
    if (fr.receiverId !== userId) throw new ForbiddenException('not your request');

    if (fr.status === FriendRequestStatus.PENDING) {
      await this.prisma.friendRequest.delete({ where: { id: requestId } });
      try { await this.prisma.subscriber.create({ data: { subscriberId: fr.senderId, ownerId: fr.receiverId } }); }
      catch (e: any) { if (!this.isUniqueError(e)) throw e; }
    }
    this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
    return { ok: true };
  }

  async removeFriend(userId: number, otherId: number) {
    const existed = await this.prisma.friendRequest.findFirst({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      },
      select: { id: true },
    });
    if (!existed) return { ok: true };

    await this.prisma.friendRequest.delete({ where: { id: existed.id } });
    await this.cleanupSubscriptionsBetween(userId, otherId);
    this.notifyBoth(userId, otherId, 'friends:lists:refresh');
    return { ok: true };
  }

  async subscribe(userId: number, targetUserId: number) {
    if (userId === targetUserId) throw new BadRequestException('self subscribe');
    await this.assertUserExists(targetUserId);

    const isFriend = await this.prisma.friendRequest.findFirst({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
      },
      select: { id: true },
    });
    if (isFriend) return { ok: true };

    try { await this.prisma.subscriber.create({ data: { subscriberId: userId, ownerId: targetUserId } }); }
    catch (e: any) { if (!this.isUniqueError(e)) throw e; }
    this.notifyBoth(userId, targetUserId, 'friends:lists:refresh');
    return { ok: true };
  }

  async unsubscribe(userId: number, targetUserId: number) {
    await this.prisma.subscriber.deleteMany({ where: { subscriberId: userId, ownerId: targetUserId } });
    this.notifyBoth(userId, targetUserId, 'friends:lists:refresh');
    return { ok: true };
  }

  async dismiss(userId: number, targetUserId: number) {
    await this.prisma.potentialFriendView.deleteMany({ where: { viewerId: userId, userId: targetUserId } });
    this.notifyOne(userId, 'friends:lists:refresh');
    return { ok: true };
  }
}