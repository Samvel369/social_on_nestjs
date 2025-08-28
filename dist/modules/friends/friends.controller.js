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
const friends_dto_1 = require("./friends.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let FriendsController = class FriendsController {
    constructor(svc) {
        this.svc = svc;
    }
    async view(user) {
        return this.svc.friendsPage(user.userId, 10);
    }
    async pIncoming(user) {
        const incoming = await this.svc.partialIncoming(user.userId);
        return { incoming };
    }
    async pOutgoing(user) {
        const outgoing = await this.svc.partialOutgoing(user.userId);
        return { outgoing };
    }
    async pFriends(user) {
        const friends = await this.svc.partialFriends(user.userId);
        return { friends };
    }
    async pSubscribers(user) {
        const subscribers = await this.svc.partialSubscribers(user.userId);
        return { subscribers };
    }
    async pSubscriptions(user) {
        const subscriptions = await this.svc.partialSubscriptions(user.userId);
        return { subscriptions };
    }
    page(user) {
        return this.svc.friendsPage(user.userId, 10);
    }
    setCleanupTime(dto, user) {
        return this.svc.friendsPage(user.userId, dto.minutes);
    }
    incoming(user) {
        return this.svc.partialIncoming(user.userId);
    }
    outgoing(user) {
        return this.svc.partialOutgoing(user.userId);
    }
    friends(user) {
        return this.svc.partialFriends(user.userId);
    }
    subscribers(user) {
        return this.svc.partialSubscribers(user.userId);
    }
    subscriptions(user) {
        return this.svc.partialSubscriptions(user.userId);
    }
    send(target, user) {
        return this.svc.sendFriendRequest(Number(target), user.userId, user.username);
    }
    cancel(rid, dto, user) {
        return this.svc.cancelFriendRequest(Number(rid), user.userId, dto.subscribe);
    }
    accept(rid, user) {
        return this.svc.acceptFriendRequest(Number(rid), user.userId);
    }
    remove(target, user) {
        return this.svc.removeFriend(Number(target), user.userId);
    }
    removePossible(target, user) {
        return this.svc.removePossibleFriend(Number(target), user.userId);
    }
    subscribe(target, user) {
        return this.svc.subscribe(Number(target), user.userId, user.username);
    }
    cleanup(dto, user) {
        return this.svc.cleanupPotentialFriends(dto.minutes, user.userId);
    }
    leave(target, user) {
        return this.svc.leaveInSubscribers(Number(target), user.userId);
    }
};
exports.FriendsController = FriendsController;
__decorate([
    (0, common_1.Get)('view'),
    (0, common_1.Render)('friends.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "view", null);
__decorate([
    (0, common_1.Get)('partials/incoming'),
    (0, common_1.Render)('partials/incoming_requests.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pIncoming", null);
__decorate([
    (0, common_1.Get)('partials/outgoing'),
    (0, common_1.Render)('partials/outgoing_requests.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pOutgoing", null);
__decorate([
    (0, common_1.Get)('partials/friends'),
    (0, common_1.Render)('partials/friends_list.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pFriends", null);
__decorate([
    (0, common_1.Get)('partials/subscribers'),
    (0, common_1.Render)('partials/subscribers.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pSubscribers", null);
__decorate([
    (0, common_1.Get)('partials/subscriptions'),
    (0, common_1.Render)('partials/subscriptions.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "pSubscriptions", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "page", null);
__decorate([
    (0, common_1.Post)('cleanup-time'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [friends_dto_1.CleanupTimeDto, Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "setCleanupTime", null);
__decorate([
    (0, common_1.Get)('friends_partial/incoming'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "incoming", null);
__decorate([
    (0, common_1.Get)('friends_partial/outgoing'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "outgoing", null);
__decorate([
    (0, common_1.Get)('friends_partial/friends'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "friends", null);
__decorate([
    (0, common_1.Get)('friends_partial/subscribers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "subscribers", null);
__decorate([
    (0, common_1.Get)('friends_partial/subscriptions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "subscriptions", null);
__decorate([
    (0, common_1.Post)('send_friend_request/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "send", null);
__decorate([
    (0, common_1.Post)('cancel_friend_request/:requestId'),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, friends_dto_1.CancelFriendDto, Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('accept_friend_request/:requestId'),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)('remove_friend/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('remove_possible_friend/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "removePossible", null);
__decorate([
    (0, common_1.Post)('subscribe/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)('cleanup_potential_friends'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [friends_dto_1.CleanupTimeDto, Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "cleanup", null);
__decorate([
    (0, common_1.Post)('leave_in_subscribers/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FriendsController.prototype, "leave", null);
exports.FriendsController = FriendsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('friends'),
    __metadata("design:paramtypes", [friends_service_1.FriendsService])
], FriendsController);
//# sourceMappingURL=friends.controller.js.map