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
exports.ProfileController = void 0;
const path = require("node:path");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const profile_service_1 = require("./profile.service");
const profile_dto_1 = require("./profile.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const UPLOAD_DIR = path.resolve(process.cwd(), 'static/uploads');
let ProfileController = class ProfileController {
    constructor(service) {
        this.service = service;
    }
    async view(user) {
        const me = await this.service.getMyProfile(user.userId);
        const current_user = {
            id: user.userId,
            userId: user.userId,
            username: me.user.username,
            avatar_url: me.user.avatarUrl ?? '',
        };
        const userView = {
            id: me.user.id,
            username: me.user.username,
            email: me.user.email ?? '',
            avatar_url: me.user.avatarUrl ?? '',
            birthdate: me.user.birthdate
                ? new Date(me.user.birthdate).toISOString().slice(0, 10)
                : '',
            status: me.user.status ?? '',
            about: me.user.about ?? '',
        };
        return { current_user, user: userView };
    }
    async publicProfile(id) {
        const data = await this.service.viewProfile(0, id);
        const userView = {
            id: data.user.id,
            username: data.user.username,
            avatar_url: data.user.avatarUrl ?? '',
            birthdate: data.user.birthdate
                ? new Date(data.user.birthdate).toISOString().slice(0, 10)
                : '',
            status: data.user.status ?? '',
            about: data.user.about ?? '',
        };
        return {
            current_user: null,
            user: userView,
            view: data.view,
        };
    }
    async editProfile(user) {
        const me = await this.service.getMyProfile(user.userId);
        const current_user = {
            id: user.userId,
            userId: user.userId,
            username: me.user.username,
            avatar_url: me.user.avatarUrl ?? '',
        };
        const userView = {
            username: me.user.username,
            email: me.user.email ?? '',
            avatar_url: me.user.avatarUrl ?? '',
            birthdate: me.user.birthdate
                ? new Date(me.user.birthdate).toISOString().slice(0, 10)
                : '',
            status: me.user.status ?? '',
            about: me.user.about ?? '',
        };
        return { current_user, user: userView, total_users: 0, online_users: 0 };
    }
    async saveProfile(user, file, body) {
        const dto = {
            birthdate: body.birthdate || null,
            status: body.status || '',
            about: body.about || '',
        };
        await this.service.updateProfile(user.userId, dto);
        if (file) {
            await this.service.updateAvatar(user.userId, file);
        }
        return { ok: true, redirect: '/api/profile/view' };
    }
    async me(user) {
        return this.service.getMyProfile(user.userId);
    }
    async byId(user, id) {
        return this.service.viewProfile(user.userId, id);
    }
    async patch(user, dto) {
        return this.service.updateProfile(user.userId, dto);
    }
    async uploadAvatar(user, file) {
        return this.service.updateAvatar(user.userId, file);
    }
    async touch(user) {
        await this.service.touch(user.userId);
        return { ok: true };
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('view'),
    (0, common_1.Render)('profile.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "view", null);
__decorate([
    (0, common_1.Get)('public/:id'),
    (0, common_1.Render)('public_profile.html'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "publicProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('edit_profile'),
    (0, common_1.Render)('edit_profile.html'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "editProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('edit_profile'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', {
        dest: UPLOAD_DIR,
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "saveProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "byId", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "patch", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', {
        dest: UPLOAD_DIR,
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('last-active'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "touch", null);
exports.ProfileController = ProfileController = __decorate([
    (0, common_1.Controller)('profile'),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map