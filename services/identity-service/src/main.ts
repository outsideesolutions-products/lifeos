import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module';
import { JsonLoggerService } from './common/json-logger.service';
import { auth } from './auth/auth.config';

const SERVICE_NAME = 'identity-service';

async function bootstrap() {
  // bodyParser disabled at bootstrap: Better Auth's handler needs the raw
  // request body (it does its own parsing). Body parsing for every OTHER
  // (NestJS-controller) route is re-enabled below, registered AFTER the
  // Better Auth catch-all so it never intercepts auth requests — Express
  // terminates a request at the first handler that responds without
  // calling next(), which is how Better Auth's handler behaves.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new JsonLoggerService(SERVICE_NAME),
    bodyParser: false,
  });

  // Registered before any route (including Better Auth's catch-all below)
  // so preflight/credentialed requests from the web app succeed. Better
  // Auth's own `trustedOrigins` config (auth.config.ts) governs its
  // internal CSRF/redirect checks — a separate concern from the actual
  // Access-Control-* response headers a browser requires, which is what
  // this provides.
  app.enableCors({
    origin: (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();

  // Better Auth owns its own routing convention under /api/auth/* (sign-in,
  // sign-up, OAuth callbacks, session management, passkey/2FA endpoints).
  // Deliberately NOT under the /api/v1 prefix used by NestJS controllers —
  // Better Auth's client SDKs expect a stable, unversioned auth base path,
  // and versioning it isn't needed for V1.
  expressApp.all('/api/auth/*', toNodeHandler(auth));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.setGlobalPrefix('api/v1');

  const port = process.env.IDENTITY_SERVICE_PORT ?? 4003;
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
