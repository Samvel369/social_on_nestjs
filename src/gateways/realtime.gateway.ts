import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/world',
  cors: { origin: '*' },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  // Клиент подключился
  handleConnection(client: Socket) {
    // общий канал как в твоём коде
    client.join('world:public');
    client.emit('hello', { ok: true, msg: 'connected to /world' });
  }

  // Клиент отключился
  handleDisconnect(_client: Socket) {
    // noop
  }

  // ==== JOIN: дать клиенту войти в свою комнату user_{id} (как во Flask) ====
  @SubscribeMessage('join')
  onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room?: string; userId?: number },
  ) {
    const room = data?.room ?? (data?.userId ? `user_${data.userId}` : undefined);
    if (room) {
      client.join(room);
      client.emit('joined', { room });
    }
  }

  // ==== Хелперы для Actions ====
  emitActionCreated(payload: any): void {
    this.server.to('world:public').emit('actions.created', payload);
  }

  emitActionDeleted(id: number): void {
    this.server.to('world:public').emit('actions.deleted', { id });
  }

  // Послать событие конкретному пользователю (совремённый helper)
  notifyUser(userId: number, event: string, data: any): void {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  // Совместимость с твоим Flask-названием комнаты user_{id}
  emitToLegacyUserRoom(userId: number, event: string, payload: any): void {
    this.server.to(`user_${userId}`).emit(event, payload);
  }
}
