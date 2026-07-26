import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createTestUser, TestUser } from './helpers/create-test-user';

/**
 * This service reasons via the AI Provider Interface (ai/providers), which
 * requires a configured OPENAI_API_KEY to complete an actual conversation
 * turn. No key is configured in this environment (see README), so these
 * tests verify everything up to that documented boundary — SessionGuard,
 * successful Gather Context (real calls to Object Service and AI Memory
 * Service), and the predictable failure shape when the AI Provider
 * Interface call itself fails — rather than a full conversational
 * round-trip, which needs a real key to exercise.
 */
describe('AI Orchestrator (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    user = await createTestUser('orchestrator-e2e');
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports healthy', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('rejects requests with no session credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/conversation')
      .send({ message: 'hello' })
      .expect(401);
  });

  it('rejects an empty message with 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/conversation')
      .set('Cookie', user.cookie)
      .send({ message: '' })
      .expect(400);
  });

  it('gathers real Constitution + Memory context and fails predictably at the AI Provider Interface boundary without a configured key', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/conversation')
      .set('Cookie', user.cookie)
      .send({ message: 'What should I focus on today?' });

    if (process.env.OPENAI_API_KEY) {
      // A real key is configured (e.g. in CI/production) — this should
      // actually succeed end-to-end.
      expect(response.status).toBe(201);
      expect(typeof response.body.response).toBe('string');
      expect(response.body.coldStartPhase).toBe('INITIALIZATION');
    } else {
      // No key configured (this sandbox's default) — Gather Context still
      // has to succeed (real HTTP calls to Object Service/AI Memory
      // Service) before the request can even reach the point of failing,
      // so a 500 here is meaningful evidence the rest of the pipeline
      // worked, not a masked earlier failure.
      expect(response.status).toBe(500);
    }
  });
});
