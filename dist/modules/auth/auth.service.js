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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async register(dto) {
        if (dto.password !== dto.confirmPassword) {
            throw new common_1.BadRequestException('Пароли не совпадают');
        }
        const exists = await this.prisma.user.findFirst({
            where: { OR: [{ username: dto.username }, { email: dto.email }] },
            select: { id: true },
        });
        if (exists)
            throw new common_1.ConflictException('Пользователь уже существует');
        const hash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                password: hash,
                birthdate: dto.birthdate ? new Date(dto.birthdate) : null,
            },
            select: { id: true, username: true, email: true, lastActive: true },
        });
        return { message: 'Регистрация прошла успешно', user };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { username: dto.username },
            select: { id: true, username: true, email: true, password: true, lastActive: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Неверный логин или пароль');
        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok)
            throw new common_1.UnauthorizedException('Неверный логин или пароль');
        const access_token = await this.jwt.signAsync({
            sub: user.id,
            username: user.username,
        });
        return {
            message: 'Успешный вход',
            access_token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.lastActive,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map