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
exports.WorldService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const realtime_gateway_1 = require("../../gateways/realtime.gateway");
let WorldService = class WorldService {
    constructor(prisma, rt) {
        this.prisma = prisma;
        this.rt = rt;
    }
    async getWorld(userId) {
        const now = new Date();
        const daily = await this.prisma.action.findMany({ where: { isDaily: true } });
        const drafts = await this.prisma.action.findMany({ where: { userId, isPublished: false } });
        const published = await this.prisma.action.findMany({
            where: { isPublished: true, expiresAt: { gt: now } },
            orderBy: { createdAt: 'desc' },
        });
        return { daily, drafts, published };
    }
    async createDaily(dto) {
        return this.prisma.action.create({
            data: { text: dto.text, isDaily: true, isPublished: true },
        });
    }
    async createDraft(userId, dto) {
        return this.prisma.action.create({
            data: { userId, text: dto.text, isPublished: false },
        });
    }
    async editAction(userId, actionId, dto) {
        const action = await this.prisma.action.findUnique({ where: { id: actionId } });
        if (!action || action.userId !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.action.update({ where: { id: actionId }, data: { text: dto.text } });
    }
    async deleteAction(userId, actionId) {
        const action = await this.prisma.action.findUnique({ where: { id: actionId } });
        if (!action || action.userId !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.action.delete({ where: { id: actionId } });
    }
    async publishAction(userId, actionId, dto) {
        const action = await this.prisma.action.findUnique({ where: { id: actionId } });
        if (!action || action.userId !== userId)
            throw new common_1.ForbiddenException();
        const now = new Date();
        const recent = await this.prisma.action.findMany({
            where: {
                userId,
                isPublished: true,
                text: { contains: action.text },
            },
        });
        for (const a of recent) {
            if (a.expiresAt && a.expiresAt > now) {
                throw new common_1.ForbiddenException('Похожее действие уже опубликовано');
            }
        }
        return this.prisma.action.update({
            where: { id: actionId },
            data: { isPublished: true, expiresAt: new Date(now.getTime() + dto.duration * 60 * 1000) },
        });
    }
    async getPublished() {
        const now = new Date();
        return this.prisma.action.findMany({
            where: { isPublished: true, expiresAt: { gt: now } },
            orderBy: { createdAt: 'desc' },
            select: { id: true, text: true },
        });
    }
    async markAction(userId, actionId, username) {
        const action = await this.prisma.action.findUnique({
            where: { id: actionId },
            select: { userId: true },
        });
        if (!action || action.userId === userId) {
            return { success: true };
        }
        const ownerId = action.userId;
        const now = new Date();
        const existing = await this.prisma.potentialFriendView.findFirst({
            where: { viewerId: ownerId, userId },
            select: { id: true },
        });
        if (existing) {
            await this.prisma.potentialFriendView.update({
                where: { id: existing.id },
                data: { timestamp: now },
            });
        }
        else {
            await this.prisma.potentialFriendView.create({
                data: { viewerId: ownerId, userId, timestamp: now },
            });
        }
        this.rt.emitToLegacyUserRoom(ownerId, 'update_possible_friends', {
            user_id: userId,
            username,
        });
        return { success: true };
    }
    async getMarkCounts() {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recent = await this.prisma.actionMark.findMany({ where: { timestamp: { gte: oneMinuteAgo } } });
        const counts = {};
        for (const m of recent)
            counts[m.actionId] = (counts[m.actionId] || 0) + 1;
        return counts;
    }
};
exports.WorldService = WorldService;
exports.WorldService = WorldService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], WorldService);
//# sourceMappingURL=world.service.js.map