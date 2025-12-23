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
const jwt_guard_1 = require("../auth/jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let WorldController = class WorldController {
    constructor(service) {
        this.service = service;
    }
    async view(user) {
        const current_user = {
            id: user.userId,
            username: user.username,
            avatar_url: user.avatarUrl ?? '',
        };
        const daily_actions = [];
        const published = [];
        const drafts = [];
        return {
            current_user,
            daily_actions,
            published,
            drafts,
        };
    }
    async mark(user, id) {
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
    (0, common_1.Post)('mark/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
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