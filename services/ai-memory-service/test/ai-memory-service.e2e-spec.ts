import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createTestUser, TestUser } from './helpers/create-test-user';

describe('AI Memory Service (e2e)', () => {
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

    user = await createTestUser('ai-memory-e2e');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests with no session credentials', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/memories?type=WORKING')
      .expect(401);
  });

  it('rejects an invalid memory type with 400', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/memories?type=NOT_A_REAL_TYPE')
      .set('Cookie', user.cookie)
      .expect(400);
  });

  it('applies the 4-hour default TTL to WORKING memory created without an explicit expiresAt', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/memories')
      .set('Cookie', user.cookie)
      .send({ memoryType: 'WORKING', content: 'e2e working memory, no expiry given' })
      .expect(201);

    expect(created.body.expiresAt).not.toBeNull();
    const expiresAt = new Date(created.body.expiresAt).getTime();
    const createdAt = new Date(created.body.createdAt).getTime();
    const hoursDiff = (expiresAt - createdAt) / (1000 * 60 * 60);
    expect(hoursDiff).toBeCloseTo(4, 1);
  });

  it('leaves non-WORKING memory permanent when no expiresAt is given', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/memories')
      .set('Cookie', user.cookie)
      .send({ memoryType: 'SEMANTIC', content: 'e2e semantic memory, permanent' })
      .expect(201);
    expect(created.body.expiresAt).toBeNull();
  });

  it('excludes expired entries from findByType and search, touches lastReferencedAt, and supports delete', async () => {
    const marker = `e2e-marker-${Date.now()}`;

    const active = await request(app.getHttpServer())
      .post('/api/v1/memories')
      .set('Cookie', user.cookie)
      .send({ memoryType: 'WORKING', content: `${marker} active entry` })
      .expect(201);

    const expired = await request(app.getHttpServer())
      .post('/api/v1/memories')
      .set('Cookie', user.cookie)
      .send({
        memoryType: 'WORKING',
        content: `${marker} expired entry`,
        expiresAt: '2020-01-01T00:00:00.000Z',
      })
      .expect(201);

    const byType = await request(app.getHttpServer())
      .get('/api/v1/memories?type=WORKING')
      .set('Cookie', user.cookie)
      .expect(200);
    const byTypeIds = byType.body.map((m: { id: string }) => m.id);
    expect(byTypeIds).toContain(active.body.id);
    expect(byTypeIds).not.toContain(expired.body.id);

    const search = await request(app.getHttpServer())
      .get(`/api/v1/memories/search?q=${marker}`)
      .set('Cookie', user.cookie)
      .expect(200);
    const searchIds = search.body.map((m: { id: string }) => m.id);
    expect(searchIds).toContain(active.body.id);
    expect(searchIds).not.toContain(expired.body.id);

    const beforeTouch = active.body.lastReferencedAt;
    await new Promise((resolve) => setTimeout(resolve, 10));
    const touched = await request(app.getHttpServer())
      .post(`/api/v1/memories/${active.body.id}/touch`)
      .set('Cookie', user.cookie)
      .expect(201);
    expect(new Date(touched.body.lastReferencedAt).getTime()).toBeGreaterThan(
      new Date(beforeTouch).getTime(),
    );

    await request(app.getHttpServer())
      .delete(`/api/v1/memories/${active.body.id}`)
      .set('Cookie', user.cookie)
      .expect(200);
  });

  it('returns 404 when touching or deleting a nonexistent memory', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await request(app.getHttpServer())
      .post(`/api/v1/memories/${fakeId}/touch`)
      .set('Cookie', user.cookie)
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/memories/${fakeId}`)
      .set('Cookie', user.cookie)
      .expect(404);
  });
});
