import { Body, Controller, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { MyActionsService } from './my-actions.service';
import { CreateActionDto, DeleteActionDto, PublishActionDto } from './my-actions.dto';

function getUserIdFromReq(req: Request): number {
  // временно берём из заголовка, как и в остальных местах
  const fromHeader = Number(req.headers['x-user-id']);
  const fromAuth = (req as any).user?.userId;
  const userId = Number.isFinite(fromHeader) ? fromHeader : Number(fromAuth);
  if (!userId) throw new Error('userId is required (x-user-id header or auth)');
  return userId;
}

@Controller('my-actions')
export class MyActionsController {
  constructor(private readonly service: MyActionsService) {}

  /** Страница моих действий: drafts + published */
  @Get()
  async page(@Req() req: Request) {
    const userId = getUserIdFromReq(req);
    return this.service.myActionsPage(userId);
  }

  /** Создать черновик */
  @Post('new')
  async create(@Req() req: Request, @Body() dto: CreateActionDto) {
    const userId = getUserIdFromReq(req);
    return this.service.createDraft(userId, dto);
  }

  /** Опубликовать (id из тела) */
  @Post('publish')
  async publish(@Req() req: Request, @Body() dto: PublishActionDto) {
    const userId = getUserIdFromReq(req);
    return this.service.publishAction(userId, dto);
  }

  /** Опубликовать (id в пути) — удобный вариант */
  @Post('publish/:id/:duration')
  async publishByPath(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Param('duration', ParseIntPipe) duration: number,
  ) {
    const userId = getUserIdFromReq(req);
    return this.service.publishAction(userId, { id, duration });
  }

  /** Удалить (id из тела) */
  @Post('delete')
  async delete(@Req() req: Request, @Body() dto: DeleteActionDto) {
    const userId = getUserIdFromReq(req);
    return this.service.deleteAction(userId, dto.id);
  }

  /** Удалить (id в пути) */
  @Post('delete/:id')
  async deleteByPath(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const userId = getUserIdFromReq(req);
    return this.service.deleteAction(userId, id);
  }
}
