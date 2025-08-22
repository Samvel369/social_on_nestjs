import { Controller, Get, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { MainService } from './main.service';

@Controller()
export class MainController {
  constructor(private readonly mainService: MainService) {}

  @Get('/')
  async home(@Req() req: Request, @Res() res: Response) {
    // Безопасная проверка авторизации (Passport? заголовок? req.user?)
    const isAuth =
      typeof (req as any).isAuthenticated === 'function'
        ? (req as any).isAuthenticated()
        : !!(req.headers['x-user-id'] || (req as any).user?.userId);

    if (isAuth) return res.redirect('/main');

    // Если ещё не настроен view engine, вернём JSON чтобы не упасть
    if (typeof res.render === 'function') return res.render('index');
    return res.json({ page: 'index' });
  }

  @Get('/main')
  async main(@Res() res: Response) {
    const topActions = await this.mainService.getTopActions();

    if (typeof res.render === 'function') {
      return res.render('main', { top_actions: topActions });
    }
    return res.json({ top_actions: topActions });
  }
}
