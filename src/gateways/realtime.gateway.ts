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

  broadcastTotalUsers(total: number) {
    this.server.emit('stats:total', { total });
  }

  private socketsByUser = new Map<number, Set<string>>();

  getOnlineCount(): number {
    return this.socketsByUser.size;
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

  // === ОБЩИЕ МЕТОДЫ УВЕДОМЛЕНИЙ ===
  emitToUser(userId: number, event: string): void {
    try { this.server.to(`user_${userId}`).emit(event); } catch {}
  }

  emitToUsers(userIds: number[], event: string): void {
    try {
      const rooms = userIds.filter(Boolean).map((id) => `user_${id}`);
      if (rooms.length) this.server.to(rooms).emit(event);
    } catch {}
  }
  
  // 🔥 МЕТОД: Отправить событие всем подключенным клиентам
  emitToAll(event: string, payload?: any): void {
    try { this.server.emit(event, payload); } catch {}
  }

  emitToLegacyUserRoom(userId: number, event: string, payload?: any): void {
    try { this.server.to(`user_${userId}`).emit(event, payload); } catch {}
  }

  // === МЕТОДЫ ЧАТА ===
  emitData(userId: number, event: string, data: any): void {
    try {
      this.server.to(`user_${userId}`).emit(event, data);
    } catch {}
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @MessageBody() data: { receiverId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = Number(client.handshake.auth?.userId);
    if (senderId && data.receiverId) {
      this.server.to(`user_${data.receiverId}`).emit('chat:typing', { senderId });
    }
  }
}