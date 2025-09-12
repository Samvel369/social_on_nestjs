import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class RealtimeGateway implements OnGatewayConnection {
    server: Server;
    private socketsByUser;
    getOnlineCount(): number;
    private trackConnect;
    private trackDisconnect;
    private broadcastStats;
    handleConnection(client: Socket): void;
    handleJoin(data: {
        room?: string;
        userId?: number;
    }, client: Socket): void;
    handleStatsRequest(client: Socket): void;
    emitToUser(userId: number, event: string): void;
    emitToUsers(userIds: number[], event: string): void;
    emitToLegacyUserRoom(userId: number, event: string, payload?: any): void;
}
