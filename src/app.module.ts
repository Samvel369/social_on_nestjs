import { Module } from '@nestjs/common';
import { RealtimeGateway } from './gateways/realtime.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [RealtimeGateway],
})
export class AppModule {}

