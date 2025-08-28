import { Controller, Get, Render } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // JSON-пинг (для мониторинга)
  @Get()
  ping() {
    return {
      ok: true,
      service: 'api',
      time: new Date().toISOString(),
    };
  }

  // HTML-страница (для быстрой проверки в браузере)
  // Ожидает templates/health.html
  @Get('view')
  @Render('health.html')
  view() {
    return {
      ok: true,
      service: 'api',
      time: new Date().toISOString(),
    };
  }
}
