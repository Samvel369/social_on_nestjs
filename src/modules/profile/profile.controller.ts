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
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Express } from 'express';

// ==== storage для загрузки аватаров ====
const uploadDir = path.resolve(process.cwd(), 'static', 'uploads');
const storage = diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch((err) => cb(err as any, uploadDir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname ?? '').toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

@UseGuards(JwtAuthGuard) // весь контроллер приватный (страницы тоже приватные)
@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  // ===== HTML =====

  /** Мой профиль (страница) -> templates/profile.html */
  @Get('view')
  @Render('profile.html')
  async viewMePage(@CurrentUser() user: AuthUser) {
    // вернём те же поля, что API getMyProfile
    return this.service.getMyProfile(user.userId);
  }

  /** Публичный профиль по id (страница) -> templates/public_profile.html */
  @Get('public/:id')
  @Render('public_profile.html')
  async viewPublicPage(@CurrentUser() me: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.viewProfile(me.userId, id);
  }

  /** (опц.) превью пользователя (паршиал) -> templates/partials/user_preview.html */
  @Get('partials/preview/:id')
  @Render('partials/user_preview.html')
  async userPreview(@CurrentUser() me: AuthUser, @Param('id', ParseIntPipe) id: number) {
    // можно отдать урезанный объект, если в паршиале нужно меньше данных
    return this.service.viewProfile(me.userId, id);
  }

  // ===== JSON API =====

  /** Мой профиль (JSON) */
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.service.getMyProfile(user.userId);
  }

  /** Профиль по id (JSON): self / friend(public) / preview */
  @Get(':id')
  async view(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.viewProfile(user.userId, id);
  }

  /** Редактирование: статус/о себе/дата рождения */
  @Patch()
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.userId, dto);
  }

  /** Загрузка аватара (multipart/form-data, поле: avatar) */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', { storage }))
  async uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.updateAvatar(user.userId, file);
  }

  /** Обновить lastActive */
  @Post('last-active')
  async touch(@CurrentUser() user: AuthUser) {
    await this.service.touch(user.userId);
    return { ok: true };
  }
}
