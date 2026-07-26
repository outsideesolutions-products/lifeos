import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createTestUser, TestUser } from './helpers/create-test-user';

describe('Object Service (e2e)', () => {
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

    user = await createTestUser('object-e2e');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SessionGuard', () => {
    it('rejects requests with no session credentials', async () => {
      await request(app.getHttpServer()).get('/api/v1/folders').expect(401);
    });
  });

  describe('Folders', () => {
    it('creates, lists, filters, updates, archives, and soft-deletes a folder', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/v1/folders')
        .set('Cookie', user.cookie)
        .send({ name: 'E2E Test Folder' })
        .expect(201);
      expect(create.body.classification).toBe(3);
      const folderId = create.body.id;

      const list = await request(app.getHttpServer())
        .get('/api/v1/folders')
        .set('Cookie', user.cookie)
        .expect(200);
      expect(list.body.some((f: { id: string }) => f.id === folderId)).toBe(true);

      const filtered = await request(app.getHttpServer())
        .get('/api/v1/folders?q=E2E Test')
        .set('Cookie', user.cookie)
        .expect(200);
      expect(filtered.body.some((f: { id: string }) => f.id === folderId)).toBe(true);

      const noMatch = await request(app.getHttpServer())
        .get('/api/v1/folders?q=zzz-no-match-zzz')
        .set('Cookie', user.cookie)
        .expect(200);
      expect(noMatch.body).toEqual([]);

      await request(app.getHttpServer())
        .patch(`/api/v1/folders/${folderId}`)
        .set('Cookie', user.cookie)
        .send({ name: 'E2E Test Folder Renamed' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/folders/${folderId}/archive`)
        .set('Cookie', user.cookie)
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/folders/${folderId}`)
        .set('Cookie', user.cookie)
        .expect(200);

      const listAfterDelete = await request(app.getHttpServer())
        .get('/api/v1/folders')
        .set('Cookie', user.cookie)
        .expect(200);
      expect(listAfterDelete.body.some((f: { id: string }) => f.id === folderId)).toBe(
        false,
      );
    });
  });

  describe('Tags', () => {
    it('rejects a duplicate tag name in the same workspace with 409', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .set('Cookie', user.cookie)
        .send({ name: 'e2e-duplicate-tag' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/tags')
        .set('Cookie', user.cookie)
        .send({ name: 'e2e-duplicate-tag' })
        .expect(409);
    });
  });

  describe('Constitution', () => {
    it('serves the seeded Product and AI Constitutions read-only', async () => {
      const product = await request(app.getHttpServer())
        .get('/api/v1/constitution/product')
        .set('Cookie', user.cookie)
        .expect(200);
      expect(product.body.title).toBeTruthy();
      expect(product.body.classification).toBe(3);

      const ai = await request(app.getHttpServer())
        .get('/api/v1/constitution/ai')
        .set('Cookie', user.cookie)
        .expect(200);
      expect(ai.body.title).toBeTruthy();
      expect(ai.body.classification).toBe(3);
    });

    it('starts a fresh workspace in the INITIALIZATION Cold Start phase with an empty Personal Constitution', async () => {
      const freshUser = await createTestUser('object-e2e-fresh');
      const personal = await request(app.getHttpServer())
        .get('/api/v1/constitution/personal')
        .set('Cookie', freshUser.cookie)
        .expect(200);
      expect(personal.body.status).toBe('INITIALIZATION');
      expect(personal.body.visionStatements).toEqual([]);
    });

    it('creates a Tier 3 sub-entity, records a version, and transitions Cold Start phase to LEARNING', async () => {
      const freshUser = await createTestUser('object-e2e-transition');

      const created = await request(app.getHttpServer())
        .post('/api/v1/constitution/personal/vision-statements')
        .set('Cookie', freshUser.cookie)
        .send({ title: 'E2E Vision', statement: 'Ship reliable software' })
        .expect(201);
      expect(created.body.classification).toBe(3);

      const personalAfter = await request(app.getHttpServer())
        .get('/api/v1/constitution/personal')
        .set('Cookie', freshUser.cookie)
        .expect(200);
      expect(personalAfter.body.status).toBe('LEARNING');
      expect(personalAfter.body.visionStatements).toHaveLength(1);
    });

    it('rejects an unknown sub-entity type with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/constitution/personal/not-a-real-type')
        .set('Cookie', user.cookie)
        .send({ statement: 'irrelevant' })
        .expect(400);
    });
  });

  describe('Onboarding', () => {
    it('tracks completion and dismissal independently in Workspace metadata', async () => {
      const freshUser = await createTestUser('object-e2e-onboarding');

      const initial = await request(app.getHttpServer())
        .get('/api/v1/onboarding/status')
        .set('Cookie', freshUser.cookie)
        .expect(200);
      expect(initial.body.onboardingCompletedAt).toBeNull();
      expect(initial.body.onboardingDismissedAt).toBeNull();

      const completed = await request(app.getHttpServer())
        .post('/api/v1/onboarding/complete')
        .set('Cookie', freshUser.cookie)
        .expect(201);
      expect(completed.body.onboardingCompletedAt).not.toBeNull();
      expect(completed.body.onboardingDismissedAt).toBeNull();

      const dismissed = await request(app.getHttpServer())
        .post('/api/v1/onboarding/dismiss')
        .set('Cookie', freshUser.cookie)
        .expect(201);
      expect(dismissed.body.onboardingCompletedAt).not.toBeNull();
      expect(dismissed.body.onboardingDismissedAt).not.toBeNull();
    });
  });
});
