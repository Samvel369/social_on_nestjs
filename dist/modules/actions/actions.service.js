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
exports.ActionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const realtime_gateway_1 = require("../../gateways/realtime.gateway");
let ActionsService = class ActionsService {
    constructor(prisma, rt) {
        this.prisma = prisma;
        this.rt = rt;
    }
    async getActionCard(actionId) {
        const action = await this.prisma.action.findUnique({
            where: { id: actionId },
            select: { id: true, text: true, userId: true, isPublished: true, createdAt: true, expiresAt: true },
        });
        if (!action)
            return { action: null, total_marks: 0, users: [], peak: 0 };
        const marks = await this.prisma.actionMark.findMany({
            where: { actionId },
            orderBy: { timestamp: 'asc' },
            select: { userId: true, timestamp: true },
        });
        const userIds = Array.from(new Set(marks.map(m => m.userId)));
        const users = userIds.length
            ? await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true },
            })
            : [];
        const minuteCounts = {};
        for (const { timestamp } of marks) {
            const d = new Date(timestamp);
            d.setSeconds(0, 0);
            const key = d.toISOString().slice(0, 16);
            minuteCounts[key] = (minuteCounts[key] ?? 0) + 1;
        }
        const peak = Object.values(minuteCounts).reduce((acc, n) => (n > acc ? n : acc), 0);
        return { action, total_marks: marks.length, users, peak };
    }
    async markAction(actionId, userId, username) {
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
        const recent = await this.prisma.actionMark.findFirst({
            where: { userId, actionId, timestamp: { gte: tenMinutesAgo } },
            select: { timestamp: true },
        });
        if (recent) {
            const remaining = 600 - Math.floor((now.getTime() - recent.timestamp.getTime()) / 1000);
            return { error: 'wait', remaining };
        }
        await this.prisma.actionMark.create({ data: { userId, actionId, timestamp: now } });
        const action = await this.prisma.action.findUnique({
            where: { id: actionId },
            select: { userId: true },
        });
        if (action && action.userId !== userId) {
            const ownerId = action.userId;
            await this.prisma.potentialFriendView.upsert({
                where: { viewerId_userId: { viewerId: ownerId, userId } },
                update: { timestamp: now },
                create: { viewerId: ownerId, userId, timestamp: now },
            });
            this.rt.emitToUser(ownerId, 'friends:lists:refresh');
        }
        return { success: true };
    }
    async getMarkCounts() {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recent = await this.prisma.actionMark.findMany({
            where: { timestamp: { gte: oneMinuteAgo } },
            select: { actionId: true },
        });
        const counts = {};
        for (const m of recent)
            counts[m.actionId] = (counts[m.actionId] || 0) + 1;
        return counts;
    }
    async getPublishedActions() {
        const now = new Date();
        return this.prisma.action.findMany({
            where: { isPublished: true, expiresAt: { gt: now } },
            orderBy: { createdAt: 'desc' },
            select: { id: true, text: true },
        });
    }
    async getActionStats(actionId) {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const allMarks = await this.prisma.actionMark.findMany({
            where: { actionId },
            select: { userId: true },
        });
        const recent = await this.prisma.actionMark.findMany({
            where: { actionId, timestamp: { gte: oneMinuteAgo } },
            select: { userId: true },
        });
        const userIds = [...new Set(allMarks.map(m => m.userId))];
        const users = userIds.length
            ? await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { username: true },
            })
            : [];
        return {
            total_marks: allMarks.length,
            peak: recent.length,
            users: users.map(u => u.username),
        };
    }
    async getTopActions() {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
        const active = await this.prisma.action.findMany({
            where: { isPublished: true, expiresAt: { gt: now } },
            select: { id: true, text: true },
        });
        const recentMarks = await this.prisma.actionMark.findMany({
            where: { timestamp: { gte: oneMinuteAgo } },
            select: { actionId: true },
        });
        const counts = new Map();
        for (const m of recentMarks) {
            counts.set(m.actionId, (counts.get(m.actionId) ?? 0) + 1);
        }
        return active
            .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
            .slice(0, 10)
            .map(a => ({ id: a.id, text: a.text, marks: counts.get(a.id) ?? 0 }));
    }
};
exports.ActionsService = ActionsService;
exports.ActionsService = ActionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], ActionsService);
//# sourceMappingURL=actions.service.js.map