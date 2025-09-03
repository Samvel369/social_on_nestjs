import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeGateway } from './gateways/realtime.gateway';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LocalsUserInterceptor } from './common/interceptors/locals-user.interceptor';

// модули
import { AuthModule } from './modules/auth/auth.module';
import { ActionsModule } from './modules/actions/actions.module';
import { FriendsModule } from './modules/friends/friends.module';
import { MyActionsModule } from './modules/my-actions/my-actions.module';
import { ProfileModule } from './modules/profile/profile.module';
import { WorldModule } from './modules/world/world.module';
import { MainModule } from './modules/main/main.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ActionsModule,
    FriendsModule,
    MyActionsModule,
    ProfileModule,
    WorldModule,
    MainModule,
  ],
  providers: [
    RealtimeGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: LocalsUserInterceptor,
    },
  ],
})
export class AppModule {}