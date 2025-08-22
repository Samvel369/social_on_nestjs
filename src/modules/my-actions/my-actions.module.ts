import { Module } from '@nestjs/common';
import { MyActionsController } from './my-actions.controller';
import { MyActionsService } from './my-actions.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [PrismaModule, GatewaysModule],
  controllers: [MyActionsController],
  providers: [MyActionsService],
})
export class MyActionsModule {}
