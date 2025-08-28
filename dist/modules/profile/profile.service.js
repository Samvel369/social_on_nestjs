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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const path = require("node:path");
const fs = require("node:fs/promises");
let ProfileService = class ProfileService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                birthdate: true,
                status: true,
                about: true,
                lastActive: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        return { user, fullAccess: true, view: 'self' };
    }
    async viewProfile(me, targetId) {
        const user = await this.prisma.user.findUnique({
            where: { id: targetId },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                birthdate: true,
                status: true,
                about: true,
                lastActive: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Пользователь не найден');
        if (user.id === me) {
            return { user, fullAccess: true, view: 'self' };
        }
        const isFriend = await this.prisma.friendRequest.findFirst({
            where: {
                status: client_1.FriendRequestStatus.ACCEPTED,
                OR: [
                    { senderId: me, receiverId: targetId },
                    { senderId: targetId, receiverId: me },
                ],
            },
            select: { id: true },
        });
        return {
            user,
            fullAccess: Boolean(isFriend),
            view: isFriend ? 'public' : 'preview',
        };
    }
    async updateProfile(userId, dto) {
        let birthdate = undefined;
        if (dto.birthdate) {
            const d = new Date(dto.birthdate + 'T00:00:00Z');
            if (Number.isNaN(d.getTime())) {
                throw new common_1.BadRequestException('Неверный формат birthdate (YYYY-MM-DD)');
            }
            birthdate = d;
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: dto.status ?? undefined,
                about: dto.about ?? undefined,
                birthdate,
            },
            select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                birthdate: true,
                status: true,
                about: true,
            },
        });
        return { ok: true, user };
    }
    async updateAvatar(userId, file) {
        if (!file)
            throw new common_1.BadRequestException('Файл не получен');
        const allowed = new Set(['.png', '.jpg', '.jpeg', '.gif']);
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (!allowed.has(ext)) {
            try {
                await fs.unlink(file.path);
            }
            catch { }
            throw new common_1.BadRequestException('Недопустимый формат файла');
        }
        const publicUrl = '/static/uploads/' + path.basename(file.path);
        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: publicUrl },
        });
        return { ok: true, avatarUrl: publicUrl };
    }
    async touch(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { lastActive: new Date() },
        });
        return { ok: true };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map