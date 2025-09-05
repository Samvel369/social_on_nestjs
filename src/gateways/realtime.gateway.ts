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

  /** Отправить событие конкретному пользователю.
   *  Поддерживает разные схемы комнат (u:<id> и просто <id>)
   *  + делает резервную отправку напрямую во все сокеты пользователя.
   */
  emitToUser(userId: number, event: string, payload?: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit(event, payload ?? {});
  }

  /** Отправить событие сразу списку пользователей (поддерживает и комнаты, и резервную отправку) */
  emitToUsers(userIds: Array<number | string>, event: string, payload: any = {}) {
    if (!this.server || !userIds?.length) return;

    const rooms: string[] = [];
    for (const id of userIds) {
      rooms.push(`u:${id}`, `${id}`);
    }
    try {
      this.server.to(rooms).emit(event, payload);
    } catch { /* ignore */ }

    try {
      const ids = new Set(userIds.map(String));
      const sockets = this.server.sockets?.sockets ?? new Map<string, any>();
      for (const [, s] of sockets) {
        const sid =
          s.data?.userId ??
          s.data?.uid ??
          s.handshake?.auth?.userId ??
          s.handshake?.query?.userId;

        if (sid != null && ids.has(String(sid))) {
          s.emit(event, payload);
        }
      }
    } catch { /* ignore */ }
  }

  /** Разослать событие всем подключённым клиентам */
  emitAll(event: string, payload: any = {}) {
    this.server?.emit(event, payload);
  }

}
