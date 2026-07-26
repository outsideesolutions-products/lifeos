import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { createTestUser, TestUser } from './helpers/create-test-user';

describe('Knowledge Graph Service (e2e)', () => {
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

    user = await createTestUser('kg-e2e');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests with no session credentials', async () => {
    await request(app.getHttpServer()).get('/api/v1/relationships').expect(401);
  });

  it('rejects an invalid relationship type with 400', async () => {
    const sourceId = randomUUID();
    const targetId = randomUUID();
    await request(app.getHttpServer())
      .post('/api/v1/relationships')
      .set('Cookie', user.cookie)
      .send({
        sourceObjectType: 'Folder',
        sourceObjectId: sourceId,
        relationshipType: 'NOT_A_REAL_TYPE',
        targetObjectType: 'Folder',
        targetObjectId: targetId,
      })
      .expect(400);
  });

  it('creates a relationship, finds it from either side, rejects a duplicate, and supports traversal', async () => {
    const projectId = randomUUID();
    const goalId = randomUUID();

    const created = await request(app.getHttpServer())
      .post('/api/v1/relationships')
      .set('Cookie', user.cookie)
      .send({
        sourceObjectType: 'Project',
        sourceObjectId: projectId,
        relationshipType: 'SUPPORTS',
        targetObjectType: 'Goal',
        targetObjectId: goalId,
      })
      .expect(201);
    expect(created.body.id).toBeTruthy();

    const fromSource = await request(app.getHttpServer())
      .get(`/api/v1/relationships?objectType=Project&objectId=${projectId}`)
      .set('Cookie', user.cookie)
      .expect(200);
    expect(fromSource.body).toHaveLength(1);

    const fromTarget = await request(app.getHttpServer())
      .get(`/api/v1/relationships?objectType=Goal&objectId=${goalId}`)
      .set('Cookie', user.cookie)
      .expect(200);
    expect(fromTarget.body).toHaveLength(1);

    await request(app.getHttpServer())
      .post('/api/v1/relationships')
      .set('Cookie', user.cookie)
      .send({
        sourceObjectType: 'Project',
        sourceObjectId: projectId,
        relationshipType: 'SUPPORTS',
        targetObjectType: 'Goal',
        targetObjectId: goalId,
      })
      .expect(409);

    const traversal = await request(app.getHttpServer())
      .get(`/api/v1/relationships/traverse?objectType=Project&objectId=${projectId}&depth=1`)
      .set('Cookie', user.cookie)
      .expect(200);
    expect(
      traversal.body.some(
        (r: { objectType: string; objectId: string }) =>
          r.objectType === 'Goal' && r.objectId === goalId,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .delete(`/api/v1/relationships/${created.body.id}`)
      .set('Cookie', user.cookie)
      .expect(200);
  });

  it('traverses in priority order: higher-strength edges at the same depth come first', async () => {
    const hubId = randomUUID();
    const weakId = randomUUID();
    const strongId = randomUUID();

    await request(app.getHttpServer())
      .post('/api/v1/relationships')
      .set('Cookie', user.cookie)
      .send({
        sourceObjectType: 'Project',
        sourceObjectId: hubId,
        relationshipType: 'REFERENCES',
        targetObjectType: 'Note',
        targetObjectId: weakId,
        strength: 0.2,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/relationships')
      .set('Cookie', user.cookie)
      .send({
        sourceObjectType: 'Project',
        sourceObjectId: hubId,
        relationshipType: 'REFERENCES',
        targetObjectType: 'Note',
        targetObjectId: strongId,
        strength: 0.9,
      })
      .expect(201);

    const traversal = await request(app.getHttpServer())
      .get(`/api/v1/relationships/traverse?objectType=Project&objectId=${hubId}&depth=1`)
      .set('Cookie', user.cookie)
      .expect(200);

    const ids = traversal.body.map((r: { objectId: string }) => r.objectId);
    expect(ids.indexOf(strongId)).toBeLessThan(ids.indexOf(weakId));
    expect(
      traversal.body.find((r: { objectId: string }) => r.objectId === strongId).strength,
    ).toBe(0.9);
  });

  it('requires objectType and objectId query params on findForObject', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/relationships')
      .set('Cookie', user.cookie)
      .expect(400);
  });
});
