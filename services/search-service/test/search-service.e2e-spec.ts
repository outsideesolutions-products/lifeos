import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createTestUser, TestUser } from './helpers/create-test-user';

const OBJECT_SERVICE_URL =
  process.env.OBJECT_SERVICE_URL ?? 'http://localhost:4004';

/**
 * Search Service has no database of its own (see src/auth/session.guard.ts)
 * — it composes results from the Object Service's real HTTP API. These
 * tests therefore need Object Service actually running, in addition to
 * Identity Service for the session, exactly like the manual verification
 * used throughout Milestone 1 development.
 */
async function createFolder(name: string, cookie: string) {
  const response = await fetch(`${OBJECT_SERVICE_URL}/api/v1/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(`createFolder failed with status ${response.status}`);
  }
  return response.json();
}

describe('Search Service (e2e)', () => {
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

    user = await createTestUser('search-e2e');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests with no session credentials', async () => {
    await request(app.getHttpServer()).get('/api/v1/search?q=test').expect(401);
  });

  it('requires a non-empty query param', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/search')
      .set('Cookie', user.cookie)
      .expect(400);
  });

  it('finds a folder created through Object Service, case-insensitively', async () => {
    const marker = `SearchE2EMarker${Date.now()}`;
    await createFolder(`${marker} Roadmap`, user.cookie);

    const results = await request(app.getHttpServer())
      .get(`/api/v1/search?q=${marker.toLowerCase()}`)
      .set('Cookie', user.cookie)
      .expect(200);

    expect(
      results.body.some(
        (r: { objectType: string; title: string }) =>
          r.objectType === 'Folder' && r.title === `${marker} Roadmap`,
      ),
    ).toBe(true);
  });

  it('returns no results for a query that matches nothing', async () => {
    const results = await request(app.getHttpServer())
      .get('/api/v1/search?q=zzz-definitely-no-match-zzz')
      .set('Cookie', user.cookie)
      .expect(200);
    expect(results.body).toEqual([]);
  });

  it('isolates results between two different workspaces', async () => {
    const marker = `IsolationMarker${Date.now()}`;
    await createFolder(marker, user.cookie);

    const otherUser = await createTestUser('search-e2e-isolation');
    const results = await request(app.getHttpServer())
      .get(`/api/v1/search?q=${marker}`)
      .set('Cookie', otherUser.cookie)
      .expect(200);
    expect(results.body).toEqual([]);
  });
});
