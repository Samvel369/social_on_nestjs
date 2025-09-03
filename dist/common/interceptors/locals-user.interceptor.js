"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalsUserInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LocalsUserInterceptor = class LocalsUserInterceptor {
    intercept(context, next) {
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
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
        return next.handle().pipe((0, operators_1.map)((data) => {
            if (res?.locals?.current_user &&
                data &&
                typeof data === 'object' &&
                !Array.isArray(data) &&
                !('current_user' in data)) {
                return { ...data, current_user: res.locals.current_user };
            }
            return data;
        }));
    }
};
exports.LocalsUserInterceptor = LocalsUserInterceptor;
exports.LocalsUserInterceptor = LocalsUserInterceptor = __decorate([
    (0, common_1.Injectable)()
], LocalsUserInterceptor);
//# sourceMappingURL=locals-user.interceptor.js.map