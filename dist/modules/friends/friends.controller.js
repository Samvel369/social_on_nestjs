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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendsController = void 0;
const common_1 = require("@nestjs/common");
const friends_service_1 = require("./friends.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let FriendsController = class FriendsController {
    constructor(service) {
        this.service = service;
    }
    async page(u, keep) {
        const keep_minutes = Math.max(1, parseInt(keep ?? '10') || 10);
        return {
            keep_minutes,
            possible_friends: await this.service.getPossible(u.userId, keep_minutes),
            incoming_requests: await this.service.getIncoming(u.userId),
            outgoing_requests: await this.service.getOutgoing(u.userId),
            friends: await this.service.getFriends(u.userId),
            subscribers: await this.service.getSubscribers(u.userId),
            subscriptions: await this.service.getSubscriptions(u.userId),
        };
    }
    async pPossible(u, keep) {
        const keep_minutes = Math.max(1, parseInt(keep ?? '10') || 10);
        return { possible_friends: await this.service.getPossible(u.userId, keep_minutes) };
    }
    async pIncoming(u) {
        return { incoming_requests: await this.service.getIncoming(u.userId) };
    }
    async pOutgoing(u) {
        return { outgoing_requests: await this.service.getOutgoing(u.userId) };
    }
    async pFriends(u) {
        return { friends: await this.service.getFriends(u.userId) };
    }
    async pSubscribers(u) {
        return { subscribers: await this.service.getSubscribers(u.userId) };
    }
    async pSubscriptions(u) {
        return { subscriptions: await this.service.getSubscriptions(u.userId) };
    }
    async request(u, id) {
        await this.service.sendFriendRequest(u.userId, id);
        return { ok: true };
    }
    async accept(u, rid) {
        await this.service.acceptFriendRequest(u.userId, rid);
        return { ok: true };
    }
    async cancel(u, rid, subscribeQ, body) {
        const raw = (subscribeQ ?? body?.subscribe ?? 'false')?.toString();
        const subscribe = raw === '1' || raw === 'true' || raw === 'on';
        await this.service.cancelFriendRequest(u.userId, rid, subscribe);
        return { ok: true };
    }
    async leave(u, rid) {
        await this.service.leaveAsSubscriber(u.userId, rid);
        return { ok: true };
    }
    async remove(u, id) {
        await this.service.removeFriend(u.userId, id);
        return { ok: true };
    }
    async subscribe(u, id) {
        await this.service.subscribe(u.userId, id);
        return { ok: true };
    }
    async unsubscribe(u, id) {
        await this.service.unsubscribe(u.userId, id);
        return { ok: true };
    }
    async dismiss(u, id) {
        await this.service.dismiss(u.userId, id);
        return { ok: true };
    }
};
exports.FriendsController = FriendsController;
__decorate([
    (0, common_1.Get)(['', 'view']),
    (0, common_1.Render)('friends.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('keep')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "page", null);
__decorate([
    (0, common_1.Get)(['partials/possible', 'partials/possible_friends']),
    (0, common_1.Render)('partials/possible_friends.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('keep')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pPossible", null);
__decorate([
    (0, common_1.Get)(['partials/incoming', 'partials/incoming_requests']),
    (0, common_1.Render)('partials/incoming_requests.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pIncoming", null);
__decorate([
    (0, common_1.Get)(['partials/outgoing', 'partials/outgoing_requests']),
    (0, common_1.Render)('partials/outgoing_requests.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pOutgoing", null);
__decorate([
    (0, common_1.Get)(['partials/friends', 'friends_partial/friends']),
    (0, common_1.Render)('partials/friends_list.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pFriends", null);
__decorate([
    (0, common_1.Get)(['partials/subscribers']),
    (0, common_1.Render)('partials/subscribers.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pSubscribers", null);
__decorate([
    (0, common_1.Get)(['partials/subscriptions']),
    (0, common_1.Render)('partials/subscriptions.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pSubscriptions", null);
__decorate([
    (0, common_1.Post)('request/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "request", null);
__decorate([
    (0, common_1.Post)('accept/:rid'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('rid', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)('cancel/:rid'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('rid', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('subscribe')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String, Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('leave-subscriber/:rid'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('rid', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "leave", null);
__decorate([
    (0, common_1.Post)('remove/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('subscribe/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)('unsubscribe/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "unsubscribe", null);
__decorate([
    (0, common_1.Post)('dismiss/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "dismiss", null);
exports.FriendsController = FriendsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('friends'),
    __metadata("design:paramtypes", [friends_service_1.FriendsService])
], FriendsController);
//# sourceMappingURL=friends.controller.js.map