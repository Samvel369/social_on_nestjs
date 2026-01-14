import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RealtimeGateway } from '../../gateways/realtime.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService, RealtimeGateway], // Добавляем Gateway, чтобы сервис мог его использовать
})
export class ChatModule {}