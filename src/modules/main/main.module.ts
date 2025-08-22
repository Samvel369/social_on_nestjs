import { Module } from '@nestjs/common';
import { MainController } from './main.controller';
import { MainService } from './main.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MainController],
  providers: [MainService, PrismaService],
})
export class MainModule {}
