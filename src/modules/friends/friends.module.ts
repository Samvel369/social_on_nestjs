import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [PrismaModule, GatewaysModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
