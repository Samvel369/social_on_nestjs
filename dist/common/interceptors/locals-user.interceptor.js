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
exports.LocalsUserInterceptor = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const realtime_gateway_1 = require("../../gateways/realtime.gateway");
const operators_1 = require("rxjs/operators");
let LocalsUserInterceptor = class LocalsUserInterceptor {
    constructor(prisma, rt) {
        this.prisma = prisma;
        this.rt = rt;
    }
    async intercept(context, next) {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        try {
            const u = req.user;
            if (u && res?.locals) {
                res.locals.current_user = {
                    id: u.userId ?? u.id,
                    userId: u.userId ?? u.id,
                    username: u.username,
                    avatar_url: u.avatarUrl ?? '',
                };
            }
        }
        catch {
        }
        try {
            res.locals.total_users = await this.prisma.user.count();
        }
        catch {
            res.locals.total_users = 0;
        }
        try {
            res.locals.online_users = this.rt.getOnlineCount();
        }
        catch {
            res.locals.online_users = 0;
        }
        return next.handle().pipe((0, operators_1.map)((data) => {
            const out = (data && typeof data === 'object' && !Array.isArray(data)) ? { ...data } : (data ?? {});
            if (res?.locals?.current_user && !('current_user' in out)) {
                out.current_user = res.locals.current_user;
            }
            if (typeof res?.locals?.total_users !== 'undefined' && !('total_users' in out)) {
                out.total_users = res.locals.total_users;
            }
            if (typeof res?.locals?.online_users !== 'undefined' && !('online_users' in out)) {
                out.online_users = res.locals.online_users;
            }
            return out;
        }));
    }
};
exports.LocalsUserInterceptor = LocalsUserInterceptor;
exports.LocalsUserInterceptor = LocalsUserInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], LocalsUserInterceptor);
//# sourceMappingURL=locals-user.interceptor.js.map