import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Единый namespace '/world'. Пользователи сидят в комнатах 'user_<id>'.
 * Публичные методы (не менять сигнатуры):
 *  - emitToUser(userId, event)
 *  - emitToUsers(userIds[], event)
 * Дополнительно: legacy-совместимость
 *  - emitToLegacyUserRoom(userId, event, payload?)
 */
@WebSocketGateway({
  namespace: '/world',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const uid = Number(client.handshake.auth?.userId || client.handshake.query?.userId);
    if (uid && Number.isFinite(uid)) {
      client.join(`user_${uid}`);
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { room?: string; userId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = data?.room || (data?.userId ? `user_${data.userId}` : undefined);
    if (room) client.join(room);
  }

  // ---- Основные эмитеры ----
  emitToUser(userId: number, event: string): void {
    try {
      this.server.to(`user_${userId}`).emit(event);
    } catch {}
  }

  emitToUsers(userIds: number[], event: string): void {
    try {
      const rooms = userIds.filter(Boolean).map((id) => `user_${id}`);
      if (rooms.length) this.server.to(rooms).emit(event);
    } catch {}
  }

  // ---- Legacy-совместимость (для старого world.service.ts) ----
  emitToLegacyUserRoom(userId: number, event: string, payload?: any): void {
    try {
      this.server.to(`user_${userId}`).emit(event, payload);
    } catch {}
  }
}
