import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { prisma } from '../src/auth/auth.config';

// Better Auth's CSRF protection rejects requests with no Origin header at
// all (see object-service's test/helpers/create-test-user.ts for the same
// issue hit from a different service).
const ORIGIN = (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000').split(',')[0];

// Note on jest-e2e.json's transform config: better-auth (and its transitive
// dependencies — @better-auth/core, @noble/hashes, better-call, etc.) ship
// ESM-only builds with no CJS fallback. ts-jest compiles this service's own
// .ts files to CommonJS `require()` calls, and Jest's own module runtime —
// unlike Node's native `require()`, which already handles this fine — can't
// load those .mjs files without help. babel.config.js + the `transform`/
// `transformIgnorePatterns: []` combination in jest-e2e.json transforms
// every dependency indiscriminately rather than maintaining an allowlist of
// individual ESM-only packages: that allowlist kept needing new entries for
// every newly-discovered transitive dependency during Milestone 1
// development, which isn't a maintainable pattern. The cost is a slower
// first run per test process (~15-20s) as everything gets Babel-transformed
// once; this is the only Milestone 1 service that needs this, since it's
// the only one importing better-auth server-side.

describe('Identity Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app as NestExpressApplication);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function uniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  }

  it('reports healthy', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('signs up, provisions a Workspace and Personal Constitution, and returns a session cookie', async () => {
    const email = uniqueEmail('identity-e2e-signup');
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', ORIGIN)
      .send({ name: 'Identity E2E', email, password: 'TestPassword123!' })
      .expect(200);

    expect(response.body.user.email).toBe(email);
    expect(response.headers['set-cookie']).toBeDefined();

    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: response.body.user.id },
    });
    expect(workspace).not.toBeNull();

    const constitution = await prisma.personalConstitution.findUnique({
      where: { workspaceId: workspace!.id },
    });
    expect(constitution).not.toBeNull();
    expect(constitution!.status).toBe('INITIALIZATION');
  });

  it('rejects sign-up with a duplicate email', async () => {
    const email = uniqueEmail('identity-e2e-duplicate');
    await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', ORIGIN)
      .send({ name: 'First', email, password: 'TestPassword123!' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', ORIGIN)
      .send({ name: 'Second', email, password: 'TestPassword123!' })
      .expect(422);
  });

  it('signs in with correct credentials and rejects incorrect ones', async () => {
    const email = uniqueEmail('identity-e2e-signin');
    const password = 'TestPassword123!';
    await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', ORIGIN)
      .send({ name: 'Sign In Test', email, password })
      .expect(200);

    const signIn = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', ORIGIN)
      .send({ email, password })
      .expect(200);
    expect(signIn.headers['set-cookie']).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', ORIGIN)
      .send({ email, password: 'WrongPassword123!' })
      .expect(401);
  });

  it('get-session returns the authenticated user for a valid cookie and null for none', async () => {
    const email = uniqueEmail('identity-e2e-session');
    const signUp = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', ORIGIN)
      .send({ name: 'Session Test', email, password: 'TestPassword123!' })
      .expect(200);
    const cookie = signUp.headers['set-cookie'][0].split(';')[0];

    const withSession = await request(app.getHttpServer())
      .get('/api/auth/get-session')
      .set('Cookie', cookie)
      .expect(200);
    expect(withSession.body.user.email).toBe(email);

    const withoutSession = await request(app.getHttpServer())
      .get('/api/auth/get-session')
      .expect(200);
    expect(withoutSession.body).toBeNull();
  });
});
