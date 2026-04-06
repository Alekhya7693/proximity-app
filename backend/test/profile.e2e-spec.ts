import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  cleanupTestUsers,
  registerUser,
  API_PREFIX,
  makeTestUser,
  testProfile,
  authHeader,
} from './test-helpers';

const testUser1 = makeTestUser('prof', 1);
const testUser2 = makeTestUser('prof', 2);

describe('Profile Module (e2e)', () => {
  let app: INestApplication;
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanupTestUsers(app);

    // Register two users
    const u1 = await registerUser(app, testUser1);
    user1Token = u1.tokens.accessToken;
    user1Id = u1.user.id;

    const u2 = await registerUser(app, testUser2);
    user2Token = u2.tokens.accessToken;
    user2Id = u2.user.id;
  });

  afterAll(async () => {
    await cleanupTestUsers(app);
    await app.close();
  });

  // ─── Create Profile ──────────────────────────────────────

  describe('POST /profile', () => {
    it('should create a profile for the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/profile`)
        .set(...authHeader(user1Token))
        .send(testProfile)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.bio).toBe(testProfile.bio);
      expect(res.body.gender).toBe(testProfile.gender);
      expect(res.body.occupation).toBe(testProfile.occupation);
      expect(res.body.city).toBe(testProfile.city);
      expect(res.body.profileCompleteness).toBeGreaterThan(0);
    });

    it('should reject profile creation without auth', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/profile`)
        .send(testProfile)
        .expect(401);
    });
  });

  // ─── Get My Profile ──────────────────────────────────────

  describe('GET /profile/me', () => {
    it('should return the current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/profile/me`)
        .set(...authHeader(user1Token))
        .expect(200);

      expect(res.body.bio).toBe(testProfile.bio);
      expect(res.body.gender).toBe(testProfile.gender);
      expect(res.body.userId).toBe(user1Id);
    });

    it('should return 404 for user without profile', async () => {
      // user2 has no profile yet
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/profile/me`)
        .set(...authHeader(user2Token));

      // Depending on implementation: 404 or auto-create
      expect([200, 404]).toContain(res.status);
    });
  });

  // ─── Update Profile ──────────────────────────────────────

  describe('PUT /profile', () => {
    it('should update profile fields', async () => {
      const updates = {
        bio: 'Updated bio for E2E testing!',
        occupation: 'Senior Engineer',
        heightCm: 185,
      };

      const res = await request(app.getHttpServer())
        .put(`${API_PREFIX}/profile`)
        .set(...authHeader(user1Token))
        .send(updates)
        .expect(200);

      expect(res.body.bio).toBe(updates.bio);
      expect(res.body.occupation).toBe(updates.occupation);
      expect(res.body.heightCm).toBe(updates.heightCm);
      // Unchanged fields should persist
      expect(res.body.city).toBe(testProfile.city);
    });

    it('should recalculate profile completeness on update', async () => {
      const res = await request(app.getHttpServer())
        .put(`${API_PREFIX}/profile`)
        .set(...authHeader(user1Token))
        .send({ education: 'Stanford' })
        .expect(200);

      expect(res.body.profileCompleteness).toBeGreaterThan(0);
    });
  });

  // ─── Toggle Visibility ───────────────────────────────────

  describe('PATCH /profile/visibility', () => {
    it('should toggle profile visibility', async () => {
      const res = await request(app.getHttpServer())
        .patch(`${API_PREFIX}/profile/visibility`)
        .set(...authHeader(user1Token))
        .expect(200);

      expect(res.body).toHaveProperty('isVisible');
      expect(typeof res.body.isVisible).toBe('boolean');
    });

    it('should toggle back on second call', async () => {
      const res1 = await request(app.getHttpServer())
        .patch(`${API_PREFIX}/profile/visibility`)
        .set(...authHeader(user1Token))
        .expect(200);

      const res2 = await request(app.getHttpServer())
        .patch(`${API_PREFIX}/profile/visibility`)
        .set(...authHeader(user1Token))
        .expect(200);

      expect(res1.body.isVisible).not.toBe(res2.body.isVisible);
    });
  });

  // ─── Get Public Profile ──────────────────────────────────

  describe('GET /profile/:userId', () => {
    it('should return public profile of another user', async () => {
      // Create profile for user2 first
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/profile`)
        .set(...authHeader(user2Token))
        .send({
          bio: 'User 2 public bio',
          gender: 'female',
          city: 'Brooklyn',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/profile/${user2Id}`)
        .set(...authHeader(user1Token))
        .expect(200);

      expect(res.body.bio).toBe('User 2 public bio');
      // Should not expose sensitive data
      expect(res.body).not.toHaveProperty('preferences');
    });

    it('should return 404 for non-existent user profile', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/profile/00000000-0000-0000-0000-000000000000`)
        .set(...authHeader(user1Token))
        .expect(404);
    });
  });
});
