import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [PrismaModule, GatewaysModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule { }
