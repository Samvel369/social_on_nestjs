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
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Res } from '@nestjs/common';
import { Response } from 'express';

const UPLOAD_DIR = path.resolve(process.cwd(), 'static/uploads');

import { getDisplayName } from '../../common/utils/user.utils';

@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) { }

  // ====================== HTML (SSR) ======================

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @Render('statistics.html')
  async stats(@CurrentUser() user: AuthUser) {
    const stats = await this.service.getStats(user.userId);
    return {
      user: {
        id: user.userId, // We need this for the base template
        username: getDisplayName({ username: user.username, firstName: undefined, lastName: undefined } as any),
      },
      stats
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('view')
  @Render('profile.html') // Убедись, что файл называется так, как у тебя в папке (public_profile.html или profile.html)
  async view(@CurrentUser() user: AuthUser) {
    const me = await this.service.getMyProfile(user.userId);
    const displayName = getDisplayName(me.user);

    const current_user = {
      id: user.userId,
      userId: user.userId,
      username: displayName, // В меню тоже будет красивое имя
      original_username: me.user.username,
      avatar_url: me.user.avatarUrl ?? '',
    };

    const userView = {
      id: me.user.id,
      username: me.user.username,
      firstName: me.user.firstName || '',
      lastName: me.user.lastName || '',
      displayName: displayName, // Главный заголовок профиля
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

  @Get('public/:id')
  @Render('public_profile.html')
  async publicProfile(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.viewProfile(0, id);
    const displayName = getDisplayName(data.user);

    const userView = {
      id: data.user.id,
      username: data.user.username,
      displayName: displayName, // 🔥
      avatar_url: data.user.avatarUrl ?? '',
      birthdate: data.user.birthdate
        ? new Date(data.user.birthdate).toISOString().slice(0, 10)
        : '',
      status: data.user.status ?? '',
      about: data.user.about ?? '',
    };

    return {
      current_user: null, // Для публичного просмотра можно оставить null или передать текущего юзера, если нужно меню
      user: userView,
      view: data.view,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('edit_profile')
  @Render('edit_profile.html')
  async editProfile(@CurrentUser() user: AuthUser) {
    const me = await this.service.getMyProfile(user.userId);

    const current_user = {
      id: user.userId,
      userId: user.userId,
      username: getDisplayName(me.user),
      avatar_url: me.user.avatarUrl ?? '',
    };

    const userView = {
      username: me.user.username,
      firstName: me.user.firstName || '',
      lastName: me.user.lastName || '',
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

  @UseGuards(JwtAuthGuard)
  @Post('edit_profile')
  @UseInterceptors(
    FileInterceptor('avatar', {
      dest: UPLOAD_DIR,
    }),
  )
  async saveProfile(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const dto = {
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      birthdate: body.birthdate || null,
      status: body.status || '',
      about: body.about || '',
    };
    await this.service.updateProfile(user.userId, dto);

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
    res.clearCookie('token');
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
  async patch(@CurrentUser() user: AuthUser, @Body() dto: any) {
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