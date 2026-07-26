import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth/auth.config';

/**
 * Shared between main.ts's production bootstrap and the e2e test suite, so
 * both exercise the exact same Express wiring — duplicating this
 * order-sensitive setup (CORS before the Better Auth catch-all, JSON body
 * parsing registered after it) in two places would risk the two drifting
 * apart silently.
 */
export function configureApp(app: NestExpressApplication): void {
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
}
