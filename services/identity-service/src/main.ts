import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { JsonLoggerService } from './common/json-logger.service';
import { configureApp } from './configure-app';

const SERVICE_NAME = 'identity-service';

async function bootstrap() {
  // bodyParser disabled at bootstrap: Better Auth's handler needs the raw
  // request body (it does its own parsing). Body parsing for every OTHER
  // (NestJS-controller) route is re-enabled inside configureApp, registered
  // AFTER the Better Auth catch-all so it never intercepts auth requests —
  // Express terminates a request at the first handler that responds
  // without calling next(), which is how Better Auth's handler behaves.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new JsonLoggerService(SERVICE_NAME),
    bodyParser: false,
  });

  configureApp(app);

  // Vercel's zero-config NestJS support sets PORT and expects the app to
  // bind to it; IDENTITY_SERVICE_PORT remains the local multi-service dev
  // default (see .env.example) so `pnpm start:dev` still works unchanged.
  const port = process.env.PORT ?? process.env.IDENTITY_SERVICE_PORT ?? 4003;
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
