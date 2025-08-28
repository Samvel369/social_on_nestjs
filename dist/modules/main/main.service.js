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
exports.MainService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let MainService = class MainService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTopActions() {
        const now = new Date();
        const activeActions = await this.prisma.action.findMany({
            where: { isPublished: true, expiresAt: { gt: now } },
        });
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
        const marks = await this.prisma.actionMark.findMany({
            where: { timestamp: { gte: oneMinuteAgo } },
            select: { actionId: true },
        });
        const counts = new Map();
        for (const m of marks) {
            counts.set(m.actionId, (counts.get(m.actionId) || 0) + 1);
        }
        const sorted = activeActions
            .map(a => ({
            ...a,
            marks: counts.get(a.id) || 0,
        }))
            .sort((a, b) => b.marks - a.marks)
            .slice(0, 10);
        return sorted;
    }
};
exports.MainService = MainService;
exports.MainService = MainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MainService);
//# sourceMappingURL=main.service.js.map