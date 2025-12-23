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
exports.MainController = void 0;
const common_1 = require("@nestjs/common");
const main_service_1 = require("./main.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const realtime_gateway_1 = require("../../gateways/realtime.gateway");
let MainController = class MainController {
    constructor(mainService, prisma, rt) {
        this.mainService = mainService;
        this.prisma = prisma;
        this.rt = rt;
    }
    root() {
        return {
            current_user: null,
        };
    }
    homeSlash() {
        return this.root();
    }
    async main(user) {
        const current_user = {
            id: user.userId,
            userId: user.userId,
            username: user.username,
            avatar_url: user?.avatarUrl ?? '',
        };
        const top_actions = await this.mainService.getTopActions();
        return {
            current_user,
            top_actions,
        };
    }
};
exports.MainController = MainController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Render)('index.html'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MainController.prototype, "root", null);
__decorate([
    (0, common_1.Get)('index'),
    (0, common_1.Render)('index.html'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MainController.prototype, "homeSlash", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('main'),
    (0, common_1.Render)('main.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MainController.prototype, "main", null);
exports.MainController = MainController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [main_service_1.MainService, prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], MainController);
//# sourceMappingURL=main.controller.js.map