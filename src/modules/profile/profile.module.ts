import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GatewaysModule } from '../../gateways/gateways.module';


@Module({
  imports: [PrismaModule, GatewaysModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
