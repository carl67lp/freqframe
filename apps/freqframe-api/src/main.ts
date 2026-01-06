import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger({
            json: true,
        }),
    });
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    app.enableCors({
        origin: (origin, callback) => {
            // Allow development origins
            if (
                !origin ||
                origin.includes('localhost') ||
                origin.includes('127.0.0.1')
            ) {
                callback(null, true);
                return;
            }
            // Allow production origins (homelab)
            if (
                origin.includes('homelab.local') ||
                origin.includes('homedashboard.local') ||
                origin.includes('192.168')
            ) {
                callback(null, true);
                return;
            }
            // Reject others
            callback(new Error('CORS not allowed'));
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    const port = process.env.PORT || 3000;
    // Bind to 0.0.0.0 to allow Docker port mapping and external access
    await app.listen(port, '0.0.0.0');
    Logger.log(
        `🚀 Application is running on: http://0.0.0.0:${port}/${globalPrefix}`
    );
}

bootstrap();
