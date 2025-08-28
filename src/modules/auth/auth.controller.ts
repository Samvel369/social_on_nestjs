import { Body, Controller, Get, Post, UseGuards, Render } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from './jwt.guard'; // тот же каталог
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

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

  // Публично: возвращает JWT
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto); // { access_token, user: { id, username, email, lastActive } }
  }

  // Приватно: проверить токен и получить текущего пользователя
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }
}
