import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [FriendsController],
  providers: [FriendsService, RealtimeGateway],
  exports: [FriendsService],
})
export class FriendsModule {}
