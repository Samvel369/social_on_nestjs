import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/world',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  // Новый метод: Рассылка общего количества пользователей
  broadcastTotalUsers(total: number) {
    this.server.emit('stats:total', { total });
  }

  // userId → Set(socketId)
  private socketsByUser = new Map<number, Set<string>>();

  // ===== counters =====
  getOnlineCount(): number {
    return this.socketsByUser.size; // уникальные юзеры
  }

  private trackConnect(userId: number, socketId: string) {
    if (!userId) return;
    let set = this.socketsByUser.get(userId);
    if (!set) {
      set = new Set<string>();
      this.socketsByUser.set(userId, set);
    }
    set.add(socketId);
    this.broadcastStats();
  }

  private trackDisconnect(userId: number, socketId: string) {
    if (!userId) return;
    const set = this.socketsByUser.get(userId);
    if (set) {
      set.delete(socketId);
      if (set.size === 0) this.socketsByUser.delete(userId);
      this.broadcastStats();
    }
  }

  private broadcastStats() {
    try {
      this.server.emit('stats:online', { online: this.getOnlineCount() });
    } catch {}
  }

  handleConnection(client: Socket) {
    const raw = (client.handshake.auth?.userId ?? client.handshake.query?.userId) as any;
    const uid = Number(raw);
    if (Number.isFinite(uid) && uid > 0) {
      // авто-вступление в комнату user_<id>
      client.join(`user_${uid}`);
      this.trackConnect(uid, client.id);

      client.on('disconnect', () => this.trackDisconnect(uid, client.id));
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

  @SubscribeMessage('stats:request')
  handleStatsRequest(@ConnectedSocket() client: Socket) {
    client.emit('stats:online', { online: this.getOnlineCount() });
  }

  // ===== main emitters (не менять сигнатуры) =====
  emitToUser(userId: number, event: string): void {
    try { this.server.to(`user_${userId}`).emit(event); } catch {}
  }

  emitToUsers(userIds: number[], event: string): void {
    try {
      const rooms = userIds.filter(Boolean).map((id) => `user_${id}`);
      if (rooms.length) this.server.to(rooms).emit(event);
    } catch {}
  }

  // legacy alias
  emitToLegacyUserRoom(userId: number, event: string, payload?: any): void {
    try { this.server.to(`user_${userId}`).emit(event, payload); } catch {}
  }
}
