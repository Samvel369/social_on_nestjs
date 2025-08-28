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
exports.WorldController = void 0;
const common_1 = require("@nestjs/common");
const world_service_1 = require("./world.service");
const world_dto_1 = require("./world.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let WorldController = class WorldController {
    constructor(service) {
        this.service = service;
    }
    async view(user) {
        const feed = await this.service.getWorld(user.userId);
        const published = await this.service.getPublished();
        return { user, feed, published };
    }
    async pFeed(user) {
        const feed = await this.service.getWorld(user.userId);
        return { feed };
    }
    async pPublished() {
        const actions = await this.service.getPublished();
        return { actions };
    }
    getWorld(user) {
        return this.service.getWorld(user.userId);
    }
    createDaily(dto) {
        return this.service.createDaily(dto);
    }
    createDraft(user, dto) {
        return this.service.createDraft(user.userId, dto);
    }
    edit(user, id, dto) {
        return this.service.editAction(user.userId, Number(id), dto);
    }
    delete(user, id) {
        return this.service.deleteAction(user.userId, Number(id));
    }
    publish(user, id, dto) {
        return this.service.publishAction(user.userId, Number(id), dto);
    }
    getPublished() {
        return this.service.getPublished();
    }
    mark(user, id) {
        return this.service.markAction(user.userId, Number(id), user.username ?? `user${user.userId}`);
    }
    getMarkCounts() {
        return this.service.getMarkCounts();
    }
};
exports.WorldController = WorldController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('view'),
    (0, common_1.Render)('world.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorldController.prototype, "view", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('partials/feed'),
    (0, common_1.Render)('partials/world_feed.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorldController.prototype, "pFeed", null);
__decorate([
    (0, common_1.Get)('partials/published'),
    (0, common_1.Render)('partials/world_published.html'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorldController.prototype, "pPublished", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorldController.prototype, "getWorld", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('daily'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [world_dto_1.CreateActionDto]),
    __metadata("design:returntype", void 0)
], WorldController.prototype, "createDaily", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('draft'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, world_dto_1.CreateActionDto]),
    __metadata("design:returntype", void 0)
], WorldController.prototype, "createDraft", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, world_dto_1.EditActionDto]),
    __metadata("design:returntype", void 0)
], WorldController.prototype, "edit", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorldController.prototype, "delete", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('publish/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, world_dto_1.PublishActionDto]),
    __metadata("design:returntype", void 0)
], WorldController.prototype, "publish", null);
__decorate([
    (0, common_1.Get)('published'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorldController.prototype, "getPublished", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('mark/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorldController.prototype, "mark", null);
__decorate([
    (0, common_1.Get)('mark-counts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorldController.prototype, "getMarkCounts", null);
exports.WorldController = WorldController = __decorate([
    (0, common_1.Controller)('world'),
    __metadata("design:paramtypes", [world_service_1.WorldService])
], WorldController);
//# sourceMappingURL=world.controller.js.map