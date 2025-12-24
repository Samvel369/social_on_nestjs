import * as path from 'node:path';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Render,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './profile.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Res } from '@nestjs/common';
import { Response } from 'express';

const UPLOAD_DIR = path.resolve(process.cwd(), 'static/uploads');

@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  // ====================== HTML (SSR) ======================

  /** Мой профиль (страница) */
  @UseGuards(JwtAuthGuard)
  @Get('view')
  @Render('profile.html')
  async view(@CurrentUser() user: AuthUser) {
    const me = await this.service.getMyProfile(user.userId);

    const current_user = {
      id: user.userId,
      userId: user.userId,
      username: me.user.username,
      avatar_url: me.user.avatarUrl ?? '',
    };

    const userView = {
      id: me.user.id,
      username: me.user.username,
      email: me.user.email ?? '',
      avatar_url: me.user.avatarUrl ?? '',
      birthdate: me.user.birthdate
        ? new Date(me.user.birthdate).toISOString().slice(0, 10)
        : '',
      status: me.user.status ?? '',
      about: me.user.about ?? '',
    };

    return { current_user, user: userView};
  }

  /** Публичный профиль (страница) */
  @Get('public/:id')
  @Render('public_profile.html')
  async publicProfile(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.viewProfile(0, id);

    const userView = {
      id: data.user.id,
      username: data.user.username,
      avatar_url: data.user.avatarUrl ?? '',
      birthdate: data.user.birthdate
        ? new Date(data.user.birthdate).toISOString().slice(0, 10)
        : '',
      status: data.user.status ?? '',
      about: data.user.about ?? '',
    };

    return {
      current_user: null,
      user: userView,
      view: data.view,
    };
  }

  /** Форма редактирования */
  @UseGuards(JwtAuthGuard)
  @Get('edit_profile')
  @Render('edit_profile.html')
  async editProfile(@CurrentUser() user: AuthUser) {
    const me = await this.service.getMyProfile(user.userId);

    const current_user = {
      id: user.userId,
      userId: user.userId,
      username: me.user.username,
      avatar_url: me.user.avatarUrl ?? '',
    };

    const userView = {
      username: me.user.username,
      email: me.user.email ?? '',
      avatar_url: me.user.avatarUrl ?? '',
      birthdate: me.user.birthdate
        ? new Date(me.user.birthdate).toISOString().slice(0, 10)
        : '',
      status: me.user.status ?? '',
      about: me.user.about ?? '',
    };

    return { current_user, user: userView };
  }

  /** Сохранение профиля (multipart, AJAX) */
  @UseGuards(JwtAuthGuard)
  @Post('edit_profile')
  @UseInterceptors(
    FileInterceptor('avatar', {
      // важно: сохраняем файл сразу в static/uploads
      dest: UPLOAD_DIR,
    }),
  )
  async saveProfile(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    // 1) текстовые поля
    const dto: UpdateProfileDto = {
      birthdate: body.birthdate || null, // ОЖИДАЕМ YYYY-MM-DD
      status: body.status || '',
      about: body.about || '',
    };
    await this.service.updateProfile(user.userId, dto);

    // 2) аватар (если прислали)
    if (file) {
      await this.service.updateAvatar(user.userId, file);
    }

    return { ok: true, redirect: '/api/profile/view' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete_account')
  async deleteAccount(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.service.deleteAccount(user.userId);

    // Удаляем куку с токеном, чтобы разлогинить браузер
    res.clearCookie('token');

    // Ответ для фронтенда (редирект на главную)
    return { ok: true, redirect: '/' };
  }

  // ====================== JSON ======================

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.service.getMyProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async byId(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.viewProfile(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async patch(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      dest: UPLOAD_DIR,
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.updateAvatar(user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post('last-active')
  async touch(@CurrentUser() user: AuthUser) {
    await this.service.touch(user.userId);
    return { ok: true };
  }
}
