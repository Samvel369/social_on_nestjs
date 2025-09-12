"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path = require("node:path");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const prisma_service_1 = require("./prisma/prisma.service");
const realtime_gateway_1 = require("./gateways/realtime.gateway");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    const prisma = app.get(prisma_service_1.PrismaService);
    const rt = app.get(realtime_gateway_1.RealtimeGateway);
    app.use(async (req, res, next) => {
        const accept = req.headers['accept'];
        const acceptsHtml = typeof accept === 'string' && accept.includes('text/html');
        if (!acceptsHtml)
            return next();
        try {
            res.locals.total_users = await prisma.user.count();
        }
        catch {
            res.locals.total_users = 0;
        }
        try {
            res.locals.online_users = rt.getOnlineCount();
        }
        catch {
            res.locals.online_users = 0;
        }
        next();
    });
    app.setGlobalPrefix('api', {
        exclude: [{ path: '/', method: common_1.RequestMethod.GET }],
    });
    app.enableCors({ origin: true, credentials: true });
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