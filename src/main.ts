import 'reflect-metadata';
import * as path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
// ВАЖНО: именно * as nunjucks
import * as nunjucks from 'nunjucks';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: '*', credentials: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Статика
  app.useStaticAssets(path.resolve(process.cwd(), 'static'), { prefix: '/static/' });

  // VIEW ENGINE: nunjucks под .html
  const viewsDir = path.resolve(process.cwd(), 'templates');
  const express = app.getHttpAdapter().getInstance();

  const env = nunjucks.configure(viewsDir, {
    autoescape: true,
    express,                                      // интеграция с express
    noCache: process.env.NODE_ENV !== 'production',
    watch: process.env.NODE_ENV !== 'production',
  });

  // Регистрируем обработчик для .html на основе env
  app.engine('html', env.render.bind(env));
  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('html');

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on http://0.0.0.0:${port}`);
}
bootstrap();
