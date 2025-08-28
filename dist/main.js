"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path = require("node:path");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const nunjucks = require("nunjucks");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: '*', credentials: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useStaticAssets(path.resolve(process.cwd(), 'static'), { prefix: '/static/' });
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
    console.log(`API listening on http://0.0.0.0:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map