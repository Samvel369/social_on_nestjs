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
        .replace(/[^\S\r\n]/g, ' ')
        .trim();
}
let MyActionsService = class MyActionsService {
    constructor(prisma, rt) {
        this.prisma = prisma;
        this.rt = rt;
    }
    async createDraft(userId, dto) {
        const text = dto.text.trim();
        if (!text) {
            throw new common_1.BadRequestException('Текст не может быть пустым');
        }
        const action = await this.prisma.action.create({
            data: {
                userId,
                text,
                normalizedText: normalizeText(text),
                isPublished: false,
                isDaily: false,
            },
            select: { id: true, text: true, isPublished: true, createdAt: true },
        });
        return { ok: true, action };
    }
    async deleteAction(userId, id) {
        const action = await this.prisma.action.findUnique({ where: { id } });
        if (!action)
            throw new common_1.NotFoundException('Действие не найдено');
        if (action.userId !== userId)
            throw new common_1.ForbiddenException('Вы не владелец действия');
        await this.prisma.action.delete({ where: { id } });
        return { ok: true };
    }
    async publishAction(userId, dto) {
        const { id, duration } = dto;
        const action = await this.prisma.action.findUnique({ where: { id } });
        if (!action)
            throw new common_1.NotFoundException('Действие не найдено');
        if (action.userId !== userId)
            throw new common_1.ForbiddenException('Вы не владелец действия');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + duration * 60000);
        const normalized = action.normalizedText || normalizeText(action.text);
        const duplicate = await this.prisma.action.findFirst({
            where: {
                userId,
                isPublished: true,
                expiresAt: { gt: now },
                normalizedText: normalized,
            },
            select: { id: true },
        });
        if (duplicate) {
            throw new common_1.BadRequestException('Похожее опубликованное действие уже активно');
        }
        const updated = await this.prisma.action.update({
            where: { id },
            data: {
                isPublished: true,
                expiresAt,
                normalizedText: normalized,
            },
            select: { id: true, text: true, isPublished: true, expiresAt: true, userId: true },
        });
        this.rt.emitActionCreated({
            id: updated.id,
            text: updated.text,
            userId: updated.userId,
            expiresAt: updated.expiresAt,
        });
        return { ok: true, action: updated };
    }
    async listDrafts(userId) {
        return this.prisma.action.findMany({
            where: { userId, isPublished: false },
            orderBy: { id: 'desc' },
            select: { id: true, text: true, createdAt: true },
        });
    }
    async listPublished(userId) {
        const now = new Date();
        return this.prisma.action.findMany({
            where: { userId, isPublished: true, expiresAt: { gt: now } },
            orderBy: { expiresAt: 'asc' },
            select: { id: true, text: true, expiresAt: true },
        });
    }
    async myActionsPage(userId) {
        const [drafts, published] = await Promise.all([
            this.listDrafts(userId),
            this.listPublished(userId),
        ]);
        return { drafts, published };
    }
};
exports.MyActionsService = MyActionsService;
exports.MyActionsService = MyActionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], MyActionsService);
//# sourceMappingURL=my-actions.service.js.map