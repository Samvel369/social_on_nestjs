"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let RealtimeGateway = class RealtimeGateway {
    handleConnection(client) {
        client.join('world:public');
        client.emit('hello', { ok: true, msg: 'connected to /world' });
    }
    handleDisconnect(_client) {
    }
    onJoin(client, data) {
        const room = data?.room ?? (data?.userId ? `user_${data.userId}` : undefined);
        if (room) {
            client.join(room);
            client.emit('joined', { room });
        }
    }
    emitActionCreated(payload) {
        this.server.to('world:public').emit('actions.created', payload);
    }
    emitActionDeleted(id) {
        this.server.to('world:public').emit('actions.deleted', { id });
    }
    notifyUser(userId, event, data) {
        this.server.to(`user_${userId}`).emit(event, data);
    }
    emitToLegacyUserRoom(userId, event, payload) {
        this.server.to(`user_${userId}`).emit(event, payload);
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onJoin", null);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/world',
        cors: { origin: '*' },
    })
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map