import { Body, Controller, Get, Param, Post, Delete, Patch, Req } from '@nestjs/common';
import { Request } from 'express';
import { WorldService } from './world.service';
import { CreateActionDto, EditActionDto, PublishActionDto } from './world.dto';

@Controller('world')
export class WorldController {
  constructor(private readonly service: WorldService) {}

  @Get()
  async getWorld(@Req() req: Request) {
    const userId = Number(req.headers['x-user-id']); // временно
    return this.service.getWorld(userId);
  }

  @Post('daily')
  createDaily(@Body() dto: CreateActionDto) {
    return this.service.createDaily(dto);
  }

  @Post('draft')
  createDraft(@Req() req: Request, @Body() dto: CreateActionDto) {
    const userId = Number(req.headers['x-user-id']);
    return this.service.createDraft(userId, dto);
  }

  @Patch(':id')
  edit(@Req() req: Request, @Param('id') id: string, @Body() dto: EditActionDto) {
    const userId = Number(req.headers['x-user-id']);
    return this.service.editAction(userId, Number(id), dto);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const userId = Number(req.headers['x-user-id']);
    return this.service.deleteAction(userId, Number(id));
  }

  @Post('publish/:id')
  publish(@Req() req: Request, @Param('id') id: string, @Body() dto: PublishActionDto) {
    const userId = Number(req.headers['x-user-id']);
    return this.service.publishAction(userId, Number(id), dto);
  }

  @Get('published')
  getPublished() {
    return this.service.getPublished();
  }

  @Post('mark/:id')
  mark(@Req() req: Request, @Param('id') id: string) {
    const userId = Number(req.headers['x-user-id']);
    const username = String(req.headers['x-username'] || `user${userId}`);
    return this.service.markAction(userId, Number(id), username);
  }

  @Get('mark-counts')
  getMarkCounts() {
    return this.service.getMarkCounts();
  }
}