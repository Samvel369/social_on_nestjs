import { Body, Controller, Get, Post, UseGuards, Render, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from './jwt.guard'; // тот же каталог
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ===== HTML =====
  // GET /auth/login  -> templates/login.html
  @Get('login')
  @Render('login.html')
  loginPage() {
    return {}; // контекст для шаблона (пока пустой)
  }

  // GET /auth/register -> templates/register.html
  @Get('register')
  @Render('register.html')
  registerPage() {
    return {};
  }

  // ===== API =====
  // Публично: создаёт пользователя
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // Публично: возвращает JWT и ставит HttpOnly-куку
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // ожидаем от сервиса { access_token, user }
    const { access_token, user } = await this.auth.login(dto);

    // кладём JWT в HttpOnly-куку, чтобы SSR-страницы под JwtAuthGuard тебя видели
    res.cookie('token', access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // включишь true на https
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // фронту достаточно ok+user; редирект делает JS
    return { ok: true, user };
  }

  // Приватно: проверить токен и получить текущего пользователя
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  // Логаут: чистим куку
  @HttpCode(200)
  @Post('logout')
  async logoutPost(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    return { ok: true };
  }

  // Логаут по ссылке
  @Get('logout')
  logoutGet(@Res() res: Response) {
    res.clearCookie('token', { path: '/' });
    return res.redirect('/api/auth/login');
  }
}