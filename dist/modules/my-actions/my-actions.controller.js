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
exports.MyActionsController = void 0;
const common_1 = require("@nestjs/common");
const my_actions_service_1 = require("./my-actions.service");
const my_actions_dto_1 = require("./my-actions.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let MyActionsController = class MyActionsController {
    constructor(service) {
        this.service = service;
    }
    async view(user) {
        const current_user = {
            id: user.userId,
            userId: user.userId,
            username: user.username,
            avatar_url: user.avatarUrl ?? '',
        };
        const drafts = [];
        const published = [];
        const total_users = 0;
        const online_users = 0;
        return { current_user, drafts, published, total_users, online_users };
    }
    async create(user, dto) {
        return this.service.createDraft(user.userId, dto);
    }
    async publish(user, dto) {
        return this.service.publishAction(user.userId, dto);
    }
    async publishByPath(user, id, duration) {
        return this.service.publishAction(user.userId, { id, duration });
    }
    async delete(user, dto) {
        return this.service.deleteAction(user.userId, dto.id);
    }
    async deleteByPath(user, id) {
        return this.service.deleteAction(user.userId, id);
    }
};
exports.MyActionsController = MyActionsController;
__decorate([
    (0, common_1.Get)('view'),
    (0, common_1.Render)('my_actions.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MyActionsController.prototype, "view", null);
__decorate([
    (0, common_1.Post)('new'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, my_actions_dto_1.CreateActionDto]),
    __metadata("design:returntype", Promise)
], MyActionsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('publish'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, my_actions_dto_1.PublishActionDto]),
    __metadata("design:returntype", Promise)
], MyActionsController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)('publish/:id/:duration'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('duration', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], MyActionsController.prototype, "publishByPath", null);
__decorate([
    (0, common_1.Post)('delete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, my_actions_dto_1.DeleteActionDto]),
    __metadata("design:returntype", Promise)
], MyActionsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('delete/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], MyActionsController.prototype, "deleteByPath", null);
exports.MyActionsController = MyActionsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('my-actions'),
    __metadata("design:paramtypes", [my_actions_service_1.MyActionsService])
], MyActionsController);
//# sourceMappingURL=my-actions.controller.js.map