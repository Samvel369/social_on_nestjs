import 'reflect-metadata';
import * as path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as nunjucks from 'nunjucks';
import * as cookieParser from 'cookie-parser';
import { PrismaService } from './prisma/prisma.service';
import { RealtimeGateway } from './gateways/realtime.gateway';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Важно: включаем cookie-parser, чтобы JwtStrategy видела req.cookies
  app.use(cookieParser());

  const prisma = app.get(PrismaService);
  const rt = app.get(RealtimeGateway);

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const accept = req.headers['accept'];
    const acceptsHtml = typeof accept === 'string' && accept.includes('text/html');
    if (!acceptsHtml) return next();

    try { res.locals.total_users  = await prisma.user.count(); } catch { res.locals.total_users  = 0; }
    try { res.locals.online_users = rt.getOnlineCount();        } catch { res.locals.online_users = 0; }

    next();
  });

  // Корень "/" оставляем без префикса, все остальное — под /api
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Статика
  app.useStaticAssets(path.resolve(process.cwd(), 'static'), { prefix: '/static/' });

  // Nunjucks для .html
  const viewsDir = path.resolve(process.cwd(), 'templates');
  const express = app.getHttpAdapter().getInstance();
  const env = nunjucks.configure(viewsDir, {
    autoescape: true,
    express,
    noCache: process.env.NODE_ENV !== 'production',
    watch: process.env.NODE_ENV !== 'production',
  });
  app.engine('html', env.render.bind(env));
  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('html');

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API listening on http://0.0.0.0:${port}`, 'Bootstrap');
}
bootstrap();
