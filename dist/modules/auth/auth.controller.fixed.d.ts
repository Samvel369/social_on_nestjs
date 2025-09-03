import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { Response } from 'express';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    loginPage(): {};
    registerPage(): {};
    register(dto: RegisterDto): Promise<{
        message: string;
        user: {
            username: string;
            email: string;
            id: number;
            lastActive: Date;
        };
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        ok: boolean;
        user: {
            id: number;
            username: string;
            email: string;
            createdAt: Date;
        };
    }>;
    me(user: AuthUser): {
        user: AuthUser;
    };
    logoutPost(res: Response): Promise<{
        ok: boolean;
    }>;
    logoutGet(res: Response): void;
}
