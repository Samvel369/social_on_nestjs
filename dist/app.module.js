"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const realtime_gateway_1 = require("./gateways/realtime.gateway");
const core_1 = require("@nestjs/core");
const locals_user_interceptor_1 = require("./common/interceptors/locals-user.interceptor");
const auth_module_1 = require("./modules/auth/auth.module");
const actions_module_1 = require("./modules/actions/actions.module");
const friends_module_1 = require("./modules/friends/friends.module");
const my_actions_module_1 = require("./modules/my-actions/my-actions.module");
const profile_module_1 = require("./modules/profile/profile.module");
const world_module_1 = require("./modules/world/world.module");
const main_module_1 = require("./modules/main/main.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            actions_module_1.ActionsModule,
            friends_module_1.FriendsModule,
            my_actions_module_1.MyActionsModule,
            profile_module_1.ProfileModule,
            world_module_1.WorldModule,
            main_module_1.MainModule,
        ],
        providers: [
            realtime_gateway_1.RealtimeGateway,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: locals_user_interceptor_1.LocalsUserInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map