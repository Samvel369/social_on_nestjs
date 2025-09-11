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
exports.MyActionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const realtime_gateway_1 = require("../../gateways/realtime.gateway");
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\S\r\n]+/g, ' ')
        .trim();
}
let MyActionsService = class MyActionsService {
    constructor(prisma, rt) {
        this.prisma = prisma;
        this.rt = rt;
    }
    async getDrafts(userId) {
        return this.prisma.action.findMany({
            where: { userId, isPublished: false },
            select: { id: true, text: true },
            orderBy: { id: 'desc' },
        });
    }
    async getPublished(userId) {
        return this.prisma.action.findMany({
            where: { userId, isPublished: true },
            select: { id: true, text: true, expiresAt: true },
            orderBy: { id: 'desc' },
        });
    }
    async createDraft(userId, dto) {
        const text = (dto.text ?? '').trim();
        if (!text)
            throw new common_1.BadRequestException('text should not be empty');
        if (text.length > 255)
            throw new common_1.BadRequestException('text is too long');
        const norm = normalizeText(text);
        const now = new Date();
        const draftExists = await this.prisma.action.findFirst({
            where: { userId, isPublished: false, normalizedText: norm },
            select: { id: true },
        });
        if (draftExists) {
            throw new common_1.BadRequestException('Такое действие у вас уже есть.');
        }
        const active = await this.prisma.action.findFirst({
            where: {
                userId,
                isPublished: true,
                normalizedText: norm,
                expiresAt: { gt: now },
            },
            select: { id: true },
        });
        if (active) {
            throw new common_1.BadRequestException('Такое действие уже опубликовано.');
        }
        return this.prisma.action.create({
            data: {
                userId,
                text,
                normalizedText: norm,
                isPublished: false,
            },
            select: { id: true, text: true },
        });
    }
    async publishAction(userId, dto) {
        const { id, duration } = dto;
        const draft = await this.prisma.action.findUnique({ where: { id } });
        if (!draft)
            throw new common_1.NotFoundException('Draft not found');
        if (draft.userId !== userId)
            throw new common_1.ForbiddenException('not your action');
        if (draft.isPublished)
            throw new common_1.BadRequestException('already published');
        const norm = draft.normalizedText || normalizeText(draft.text);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (duration ?? 10) * 60000);
        const duplicate = await this.prisma.action.findFirst({
            where: {
                userId,
                isPublished: true,
                normalizedText: norm,
                expiresAt: { gt: now },
            },
            select: { id: true },
        });
        if (duplicate) {
            throw new common_1.BadRequestException('Такое действие уже опубликовано.');
        }
        return this.prisma.action.update({
            where: { id },
            data: {
                isPublished: true,
                normalizedText: norm,
                expiresAt,
            },
            select: { id: true, text: true, expiresAt: true },
        });
    }
    async deleteAction(userId, id) {
        const action = await this.prisma.action.findUnique({ where: { id } });
        if (!action)
            throw new common_1.NotFoundException('Action not found');
        if (action.userId !== userId)
            throw new common_1.ForbiddenException('not your action');
        if (action.isPublished) {
            await this.prisma.actionMark.deleteMany({ where: { actionId: id } });
        }
        await this.prisma.action.delete({ where: { id } });
        return { ok: true };
    }
};
exports.MyActionsService = MyActionsService;
exports.MyActionsService = MyActionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], MyActionsService);
//# sourceMappingURL=my-actions.service.js.map