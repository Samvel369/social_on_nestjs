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
        const uid = Number(client.handshake.auth?.userId || client.handshake.query?.userId);
        if (uid && Number.isFinite(uid)) {
            client.join(`user_${uid}`);
        }
    }
    handleJoin(data, client) {
        const room = data?.room || (data?.userId ? `user_${data.userId}` : undefined);
        if (room)
            client.join(room);
    }
    emitToUser(userId, event) {
        try {
            this.server.to(`user_${userId}`).emit(event);
        }
        catch { }
    }
    emitToUsers(userIds, event) {
        try {
            const rooms = userIds.filter(Boolean).map((id) => `user_${id}`);
            if (rooms.length)
                this.server.to(rooms).emit(event);
        }
        catch { }
    }
    emitToLegacyUserRoom(userId, event, payload) {
        try {
            this.server.to(`user_${userId}`).emit(event, payload);
        }
        catch { }
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleJoin", null);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/world',
        cors: { origin: true, credentials: true },
    })
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map