import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Express } from 'express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

function getUserIdFromReq(req: Request): number {
  const fromHeader = Number(req.headers['x-user-id']);
  const fromAuth = (req as any).user?.userId;
  const userId = Number.isFinite(fromHeader) ? fromHeader : Number(fromAuth);
  if (!userId) throw new Error('userId is required (x-user-id header or auth)');
  return userId;
}

// Настроим сохранение в static/uploads
const uploadDir = path.resolve(process.cwd(), 'static', 'uploads');

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    // promises-API ок, главное — не делать сам колбэк async
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch((err) => cb(err as any, uploadDir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname ?? '').toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  /** Мой профиль */
  @Get('me')
  async me(@Req() req: Request) {
    const userId = getUserIdFromReq(req);
    return this.service.getMyProfile(userId);
  }

  /** Профиль по id: self / friend(public) / preview */
  @Get(':id')
  async view(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const me = getUserIdFromReq(req);
    return this.service.viewProfile(me, id);
  }

  /** Редактирование: статус/о себе/дата рождения */
  @Patch()
  async update(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = getUserIdFromReq(req);
    return this.service.updateProfile(userId, dto);
  }

  /** Загрузка аватара (multipart/form-data, поле: avatar) */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', { storage }))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = getUserIdFromReq(req);
    return this.service.updateAvatar(userId, file);
  }

  /** Обновить lastActive */
  @Post('last-active')
  async touch(@Req() req: Request) {
    const userId = getUserIdFromReq(req);
    await this.service.touch(userId);
    return { ok: true };
  }
}
