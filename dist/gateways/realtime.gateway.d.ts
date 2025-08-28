import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(_client: Socket): void;
    onJoin(client: Socket, data: {
        room?: string;
        userId?: number;
    }): void;
    emitActionCreated(payload: any): void;
    emitActionDeleted(id: number): void;
    notifyUser(userId: number, event: string, data: any): void;
    emitToLegacyUserRoom(userId: number, event: string, payload: any): void;
}
