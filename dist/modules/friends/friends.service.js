"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const realtime_gateway_1 = require("../../gateways/realtime.gateway");
const client_1 = require("@prisma/client");
let FriendsService = class FriendsService {
    constructor(prisma, rt) {
        this.prisma = prisma;
        this.rt = rt;
    }
    mapUser(u) {
        return { id: u.id, username: u.username, avatar_url: u.avatarUrl ?? '' };
    }
    notifyOne(userId, event) {
        try {
            this.rt.emitToUser(userId, event);
        }
        catch { }
    }
    notifyBoth(a, b, event) {
        try {
            this.rt.emitToUsers([a, b], event);
        }
        catch { }
    }
    async assertUserExists(userId) {
        const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!u)
            throw new common_1.NotFoundException('user not found');
    }
    isUniqueError(e) {
        return e && typeof e === 'object' && e.code === 'P2002';
    }
    async getPossible(viewerId, keepMinutes = 10) {
        const since = new Date(Date.now() - keepMinutes * 60000);
        const rows = await this.prisma.potentialFriendView.findMany({
            where: { viewerId, timestamp: { gte: since } },
            include: { user: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { timestamp: 'desc' },
        });
        return rows.map(r => this.mapUser(r.user));
    }
    async getIncoming(userId) {
        const rows = await this.prisma.friendRequest.findMany({
            where: { receiverId: userId, status: client_1.FriendRequestStatus.PENDING },
            include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { id: 'desc' },
        });
        return rows.map(r => ({ id: r.id, sender: this.mapUser(r.sender) }));
    }
    async getOutgoing(userId) {
        const rows = await this.prisma.friendRequest.findMany({
            where: { senderId: userId, status: client_1.FriendRequestStatus.PENDING },
            include: { receiver: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { id: 'desc' },
        });
        return rows.map(r => ({ id: r.id, receiver: this.mapUser(r.receiver) }));
    }
    async getFriends(userId) {
        const rows = await this.prisma.friendRequest.findMany({
            where: {
                status: client_1.FriendRequestStatus.ACCEPTED,
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
                receiver: { select: { id: true, username: true, avatarUrl: true } },
            },
            orderBy: { id: 'desc' },
        });
        return rows.map(r => this.mapUser(r.senderId === userId ? r.receiver : r.sender));
    }
    async getSubscribers(userId) {
        const rows = await this.prisma.subscriber.findMany({
            where: { ownerId: userId },
            include: { subscriber: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { id: 'desc' },
        });
        return rows.map(r => this.mapUser(r.subscriber));
    }
    async getSubscriptions(userId) {
        const rows = await this.prisma.subscriber.findMany({
            where: { subscriberId: userId },
            include: { owner: { select: { id: true, username: true, avatarUrl: true } } },
            orderBy: { id: 'desc' },
        });
        return rows.map(r => this.mapUser(r.owner));
    }
    async sendFriendRequest(userId, toUserId) {
        if (userId === toUserId)
            throw new common_1.BadRequestException('self request');
        await this.assertUserExists(toUserId);
        const existing = await this.prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: toUserId },
                    { senderId: toUserId, receiverId: userId },
                ],
                status: { in: [client_1.FriendRequestStatus.PENDING, client_1.FriendRequestStatus.ACCEPTED] },
            },
            select: { id: true, senderId: true, receiverId: true, status: true },
        });
        if (existing) {
            if (existing.status === client_1.FriendRequestStatus.ACCEPTED) {
                this.notifyBoth(userId, toUserId, 'friends:lists:refresh');
                return { ok: true, alreadyFriends: true };
            }
            if (existing.senderId === userId) {
                this.notifyBoth(userId, toUserId, 'friends:lists:refresh');
                return { ok: true, duplicatePending: true };
            }
            await this.prisma.friendRequest.update({
                where: { id: existing.id },
                data: { status: client_1.FriendRequestStatus.ACCEPTED },
            });
            this.notifyBoth(userId, toUserId, 'friends:lists:refresh');
            return { ok: true, autoAccepted: true };
        }
        try {
            await this.prisma.friendRequest.create({
                data: { senderId: userId, receiverId: toUserId, status: client_1.FriendRequestStatus.PENDING },
            });
        }
        catch (e) {
            if (!this.isUniqueError(e))
                throw e;
        }
        this.notifyBoth(userId, toUserId, 'friends:lists:refresh');
        return { ok: true };
    }
    async acceptFriendRequest(userId, requestId) {
        const fr = await this.prisma.friendRequest.findUnique({
            where: { id: requestId },
            select: { id: true, senderId: true, receiverId: true, status: true },
        });
        if (!fr)
            return { ok: true };
        if (fr.receiverId !== userId)
            throw new common_1.ForbiddenException('not your request');
        if (fr.status !== client_1.FriendRequestStatus.PENDING) {
            this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
            return { ok: true };
        }
        await this.prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: client_1.FriendRequestStatus.ACCEPTED },
        });
        this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
        return { ok: true };
    }
    async cancelFriendRequest(userId, requestId, subscribe = false) {
        const fr = await this.prisma.friendRequest.findUnique({
            where: { id: requestId },
            select: { id: true, senderId: true, receiverId: true, status: true },
        });
        if (!fr)
            return { ok: true };
        if (fr.senderId !== userId)
            throw new common_1.ForbiddenException('not your request');
        if (fr.status === client_1.FriendRequestStatus.PENDING) {
            await this.prisma.friendRequest.delete({ where: { id: requestId } });
            if (subscribe)
                await this.ensureSubscription(userId, fr.receiverId);
            this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
            return { ok: true };
        }
        this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
        return { ok: true };
    }
    async leaveAsSubscriber(userId, requestId) {
        const fr = await this.prisma.friendRequest.findUnique({
            where: { id: requestId },
            select: { id: true, senderId: true, receiverId: true, status: true },
        });
        if (!fr)
            return { ok: true };
        if (fr.receiverId !== userId)
            throw new common_1.ForbiddenException('not your request');
        if (fr.status === client_1.FriendRequestStatus.PENDING) {
            await this.prisma.friendRequest.delete({ where: { id: requestId } });
            await this.ensureSubscription(fr.senderId, fr.receiverId);
            this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
            return { ok: true };
        }
        this.notifyBoth(fr.senderId, fr.receiverId, 'friends:lists:refresh');
        return { ok: true };
    }
    async removeFriend(userId, otherId) {
        const fr = await this.prisma.friendRequest.findFirst({
            where: {
                status: client_1.FriendRequestStatus.ACCEPTED,
                OR: [
                    { senderId: userId, receiverId: otherId },
                    { senderId: otherId, receiverId: userId },
                ],
            },
            select: { id: true, senderId: true, receiverId: true },
        });
        if (!fr)
            return { ok: true };
        await this.prisma.friendRequest.delete({ where: { id: fr.id } });
        this.notifyBoth(userId, otherId, 'friends:lists:refresh');
        return { ok: true };
    }
    async subscribe(userId, targetUserId) {
        if (userId === targetUserId)
            throw new common_1.BadRequestException('self subscribe');
        await this.assertUserExists(targetUserId);
        const isFriend = await this.prisma.friendRequest.findFirst({
            where: {
                status: client_1.FriendRequestStatus.ACCEPTED,
                OR: [
                    { senderId: userId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: userId },
                ],
            },
            select: { id: true },
        });
        if (isFriend)
            return { ok: true };
        try {
            await this.prisma.subscriber.create({ data: { subscriberId: userId, ownerId: targetUserId } });
        }
        catch (e) {
            if (!this.isUniqueError(e))
                throw e;
        }
        this.notifyBoth(userId, targetUserId, 'friends:lists:refresh');
        return { ok: true };
    }
    async unsubscribe(userId, targetUserId) {
        await this.prisma.subscriber.deleteMany({ where: { subscriberId: userId, ownerId: targetUserId } });
        this.notifyBoth(userId, targetUserId, 'friends:lists:refresh');
        return { ok: true };
    }
    async dismiss(userId, targetUserId) {
        await this.prisma.potentialFriendView.deleteMany({ where: { viewerId: userId, userId: targetUserId } });
        this.notifyOne(userId, 'friends:lists:refresh');
        return { ok: true };
    }
    async ensureSubscription(subscriberId, ownerId) {
        if (subscriberId === ownerId)
            return;
        try {
            await this.prisma.subscriber.create({ data: { subscriberId, ownerId } });
        }
        catch (e) {
            if (!this.isUniqueError(e))
                throw e;
        }
    }
};
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], FriendsService);
//# sourceMappingURL=friends.service.js.map