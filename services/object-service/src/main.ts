import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JsonLoggerService } from './common/json-logger.service';

const SERVICE_NAME = 'object-service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLoggerService(SERVICE_NAME),
  });

  app.enableCors({
    origin: (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // Vercel's zero-config NestJS support sets PORT and expects the app to
  // bind to it; OBJECT_SERVICE_PORT remains the local multi-service dev
  // default (see .env.example) so `pnpm start:dev` still works unchanged.
  const port = process.env.PORT ?? process.env.OBJECT_SERVICE_PORT ?? 4004;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      severity: 'info',
      message: `listening on port ${port}`,
    }),
  );
}

bootstrap();
