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
exports.ActionsController = void 0;
const common_1 = require("@nestjs/common");
const actions_service_1 = require("./actions.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ActionsController = class ActionsController {
    constructor(actionsService) {
        this.actionsService = actionsService;
    }
    getActionCard(id) {
        return this.actionsService.getActionCard(Number(id));
    }
    mark(id, user) {
        return this.actionsService.markAction(Number(id), user.userId, user.username ?? `user${user.userId}`);
    }
    getMarkCounts() {
        return this.actionsService.getMarkCounts();
    }
    getPublishedActions() {
        return this.actionsService.getPublishedActions();
    }
    getActionStats(id) {
        return this.actionsService.getActionStats(Number(id));
    }
    getTopActions() {
        return this.actionsService.getTopActions();
    }
    async renderActionCard(id, res) {
        const data = await this.actionsService.getActionCard(Number(id));
        return res.render('partials/action_card.html', {
            action: data.action,
            users: data.users,
            total_marks: data.total_marks,
            peak: data.peak,
        });
    }
};
exports.ActionsController = ActionsController;
__decorate([
    (0, common_1.Get)('action/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ActionsController.prototype, "getActionCard", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('mark_action/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ActionsController.prototype, "mark", null);
__decorate([
    (0, common_1.Get)('get_mark_counts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActionsController.prototype, "getMarkCounts", null);
__decorate([
    (0, common_1.Get)('get_published_actions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActionsController.prototype, "getPublishedActions", null);
__decorate([
    (0, common_1.Get)('action_stats/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ActionsController.prototype, "getActionStats", null);
__decorate([
    (0, common_1.Get)('get_top_actions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActionsController.prototype, "getTopActions", null);
__decorate([
    (0, common_1.Get)('action_card/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ActionsController.prototype, "renderActionCard", null);
exports.ActionsController = ActionsController = __decorate([
    (0, common_1.Controller)('actions'),
    __metadata("design:paramtypes", [actions_service_1.ActionsService])
], ActionsController);
//# sourceMappingURL=actions.controller.js.map