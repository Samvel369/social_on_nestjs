import { Module } from '@nestjs/common';
import { WorldController } from './world.controller';
import { WorldService } from './world.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [WorldController],
  providers: [WorldService, RealtimeGateway],
})
export class WorldModule {}