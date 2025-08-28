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
    async areFriends(a, b) {
        const fr = await this.prisma.friendRequest.findFirst({
            where: {
                status: client_1.FriendRequestStatus.ACCEPTED,
                OR: [
                    { senderId: a, receiverId: b },
                    { senderId: b, receiverId: a },
                ],
            },
            select: { id: true },
        });
        return !!fr;
    }
    truthy(v) {
        return v === '1' || v === 'true' || v === 'True' || v === 'on';
    }
    async friendsPage(userId, minutesFromSession = 10) {
        const friendsAccepted = await this.prisma.friendRequest.findMany({
            where: { status: client_1.FriendRequestStatus.ACCEPTED, OR: [{ senderId: userId }, { receiverId: userId }] },
            include: { sender: true, receiver: true },
        });
        const friends = friendsAccepted.map(fr => fr.senderId === userId ? fr.receiver : fr.sender);
        const incomingRequests = await this.prisma.friendRequest.findMany({
            where: { receiverId: userId, status: client_1.FriendRequestStatus.PENDING },
            orderBy: { id: 'desc' },
            include: { sender: true },
        });
        const outgoingRequests = await this.prisma.friendRequest.findMany({
            where: { senderId: userId, status: client_1.FriendRequestStatus.PENDING },
            orderBy: { id: 'desc' },
            include: { receiver: true },
        });
        const myActions = await this.prisma.action.findMany({ where: { userId }, select: { id: true } });
        const actionIds = myActions.map(a => a.id);
        let markedUserIds = [];
        if (actionIds.length) {
            const marks = await this.prisma.actionMark.findMany({
                where: { actionId: { in: actionIds }, userId: { not: userId } },
                distinct: ['userId'],
                select: { userId: true },
            });
            markedUserIds = marks.map(m => m.userId);
        }
        const subscribers = await this.prisma.user.findMany({
            where: { subscriptions: { some: { ownerId: userId } } },
        });
        const subscriptions = await this.prisma.user.findMany({
            where: { subscribers: { some: { subscriberId: userId } } },
        });
        const excludeIds = new Set([
            userId,
            ...incomingRequests.map(r => r.senderId),
            ...outgoingRequests.map(r => r.receiverId),
            ...friends.map(f => f.id),
            ...subscribers.map(s => s.id),
        ]);
        const cutoff = new Date(Date.now() - minutesFromSession * 60 * 1000);
        const recentCandidateRows = await this.prisma.potentialFriendView.findMany({
            where: { viewerId: userId, timestamp: { gte: cutoff } },
            select: { userId: true },
        });
        const recentIds = new Set(recentCandidateRows.map(r => r.userId));
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
    async _collectFriendsPageData(userId) {
        const incoming = await this.prisma.friendRequest.findMany({
            where: { receiverId: userId, status: client_1.FriendRequestStatus.PENDING },
            orderBy: { id: 'desc' },
        });
        const outgoing = await this.prisma.friendRequest.findMany({
            where: { senderId: userId, status: client_1.FriendRequestStatus.PENDING },
            orderBy: { id: 'desc' },
        });
        const accepted = await this.prisma.friendRequest.findMany({
            where: { status: client_1.FriendRequestStatus.ACCEPTED, OR: [{ senderId: userId }, { receiverId: userId }] },
        });
        const friendIds = accepted.map(fr => fr.senderId === userId ? fr.receiverId : fr.senderId);
        const friends = friendIds.length
            ? await this.prisma.user.findMany({ where: { id: { in: friendIds } } })
            : [];
        const subscribers = await this.prisma.user.findMany({
            where: { subscribers: { some: { ownerId: userId } } },
        });
        const subscriptions = await this.prisma.user.findMany({
            where: { subscribers: { some: { subscriberId: userId } } },
        });
        return { incoming, outgoing, friends, subscribers, subscriptions };
    }
    async partialIncoming(userId) {
        const { incoming } = await this._collectFriendsPageData(userId);
        return { incoming_requests: incoming };
    }
    async partialOutgoing(userId) {
        const { outgoing } = await this._collectFriendsPageData(userId);
        return { outgoing_requests: outgoing };
    }
    async partialFriends(userId) {
        const { friends } = await this._collectFriendsPageData(userId);
        return { friends };
    }
    async partialSubscribers(userId) {
        const { subscribers } = await this._collectFriendsPageData(userId);
        return { subscribers };
    }
    async partialSubscriptions(userId) {
        const { subscriptions } = await this._collectFriendsPageData(userId);
        return { subscriptions };
    }
    async sendFriendRequest(targetId, me, meUsername) {
        if (me === targetId)
            throw new common_1.BadRequestException('Нельзя добавить в друзья самого себя');
        if (await this.areFriends(me, targetId)) {
            return { ok: true, message: 'Вы уже друзья' };
        }
        const pending = await this.prisma.friendRequest.findFirst({
            where: {
                status: client_1.FriendRequestStatus.PENDING,
                OR: [
                    { senderId: me, receiverId: targetId },
                    { senderId: targetId, receiverId: me },
                ],
            },
        });
        if (pending) {
            return { ok: true, message: 'Заявка уже существует', data: { request_id: pending.id } };
        }
        const fr = await this.prisma.friendRequest.create({
            data: { senderId: me, receiverId: targetId, status: client_1.FriendRequestStatus.PENDING },
        });
        await this.prisma.potentialFriendView.deleteMany({
            where: { viewerId: me, userId: targetId },
        });
        const sender = await this.prisma.user.findUnique({ where: { id: me } });
        this.rt.emitToLegacyUserRoom(targetId, 'friend_request_sent', {
            request_id: fr.id,
            sender_id: me,
            sender_username: meUsername ?? sender?.username,
            sender_avatar: sender?.avatarUrl ?? null,
        });
        return { ok: true, message: 'Заявка отправлена', data: { request_id: fr.id } };
    }
    async cancelFriendRequest(requestId, me, subscribeFlag) {
        const fr = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!fr)
            throw new common_1.BadRequestException('Заявка не найдена');
        if (me !== fr.senderId && me !== fr.receiverId)
            throw new common_1.ForbiddenException();
        const senderId = fr.senderId;
        const receiverId = fr.receiverId;
        if (this.truthy(subscribeFlag) && me === receiverId) {
            const exists = await this.prisma.subscriber.findFirst({
                where: { subscriberId: senderId, ownerId: receiverId },
            });
            if (!exists) {
                await this.prisma.subscriber.create({ data: { subscriberId: senderId, ownerId: receiverId } });
            }
            const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
            const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
            this.rt.emitToLegacyUserRoom(receiverId, 'new_subscriber', {
                subscriber_id: senderId,
                subscriber_username: sender?.username,
                subscriber_avatar: sender?.avatarUrl ?? null,
            });
            this.rt.emitToLegacyUserRoom(senderId, 'subscribed_to', {
                user_id: receiverId,
                username: receiver?.username,
                avatar: receiver?.avatarUrl ?? null,
            });
        }
        await this.prisma.friendRequest.delete({ where: { id: requestId } });
        this.rt.emitToLegacyUserRoom(senderId, 'friend_request_cancelled', { request_id: requestId });
        this.rt.emitToLegacyUserRoom(receiverId, 'friend_request_cancelled', { request_id: requestId });
        return { ok: true, message: 'Заявка отменена' };
    }
    async acceptFriendRequest(requestId, me) {
        const fr = await this.prisma.friendRequest.findUnique({ where: { id: requestId } });
        if (!fr)
            throw new common_1.BadRequestException('Заявка не найдена');
        if (fr.receiverId !== me)
            throw new common_1.ForbiddenException();
        if (fr.status !== client_1.FriendRequestStatus.PENDING)
            return { ok: true, message: 'Уже обработано' };
        await this.prisma.friendRequest.update({
            where: { id: fr.id },
            data: { status: client_1.FriendRequestStatus.ACCEPTED },
        });
        await this.prisma.subscriber.deleteMany({
            where: {
                OR: [
                    { ownerId: fr.senderId, subscriberId: fr.receiverId },
                    { ownerId: fr.receiverId, subscriberId: fr.senderId },
                ],
            },
        });
        this.rt.emitToLegacyUserRoom(fr.senderId, 'friend_accepted', { request_id: fr.id });
        this.rt.emitToLegacyUserRoom(fr.receiverId, 'friend_accepted', { request_id: fr.id });
        this.rt.emitToLegacyUserRoom(fr.senderId, 'subscribers_refresh', {});
        this.rt.emitToLegacyUserRoom(fr.receiverId, 'subscribers_refresh', {});
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
    async removeFriend(targetId, me) {
        const fr = await this.prisma.friendRequest.findFirst({
            where: {
                status: client_1.FriendRequestStatus.ACCEPTED,
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
    async removePossibleFriend(targetId, me) {
        await this.prisma.potentialFriendView.deleteMany({
            where: { viewerId: me, userId: targetId },
        });
        return { ok: true };
    }
    async subscribe(targetId, me, meUsername) {
        if (me === targetId)
            throw new common_1.BadRequestException('Нельзя подписаться на себя');
        const exists = await this.prisma.subscriber.findFirst({
            where: { subscriberId: me, ownerId: targetId },
        });
        if (exists)
            return { ok: true, message: 'Уже подписаны' };
        if (await this.areFriends(me, targetId)) {
            throw new common_1.BadRequestException('Вы уже друзья — подписка не нужна');
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
    async cleanupPotentialFriends(minutes, me) {
        const threshold = new Date(Date.now() - minutes * 60 * 1000);
        await this.prisma.potentialFriendView.deleteMany({
            where: { viewerId: me, timestamp: { lt: threshold } },
        });
        return { ok: true };
    }
    async leaveInSubscribers(targetId, me) {
        if (targetId === me)
            return { ok: true };
        const exists = await this.prisma.subscriber.findFirst({
            where: { subscriberId: targetId, ownerId: me },
        });
        if (!exists) {
            await this.prisma.subscriber.create({ data: { subscriberId: targetId, ownerId: me } });
        }
        return { ok: true };
    }
};
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], FriendsService);
//# sourceMappingURL=friends.service.js.map