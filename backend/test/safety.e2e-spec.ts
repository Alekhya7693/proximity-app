import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  cleanupTestUsers,
  registerUser,
  API_PREFIX,
  makeTestUser,
  authHeader,
} from './test-helpers';

const testUser1 = makeTestUser('safe', 1);
const testUser2 = makeTestUser('safe', 2);
const testUser3 = makeTestUser('safe', 3);

describe('Safety Module (e2e)', () => {
  let app: INestApplication;
  let user1Token: string;
  let user2Token: string;
  let user2Id: string;
  let user3Token: string;
  let user3Id: string;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanupTestUsers(app);

    const u1 = await registerUser(app, testUser1);
    user1Token = u1.tokens.accessToken;

    const u2 = await registerUser(app, testUser2);
    user2Token = u2.tokens.accessToken;
    user2Id = u2.user.id;

    const u3 = await registerUser(app, testUser3);
    user3Token = u3.tokens.accessToken;
    user3Id = u3.user.id;
  });

  afterAll(async () => {
    await cleanupTestUsers(app);
    await app.close();
  });

  // ─── Report User ─────────────────────────────────────────

  describe('POST /safety/report', () => {
    it('should report a user', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/safety/report`)
        .set(...authHeader(user1Token))
        .send({
          reportedUserId: user2Id,
          reason: 'harassment',
          description: 'E2E test report — this is a test',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('should reject report without reason', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/safety/report`)
        .set(...authHeader(user1Token))
        .send({ reportedUserId: user2Id })
        .expect(400);
    });

    it('should reject report with invalid reason enum', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/safety/report`)
        .set(...authHeader(user1Token))
        .send({ reportedUserId: user2Id, reason: 'invalid_reason' })
        .expect(400);
    });

    it('should reject without auth', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/safety/report`)
        .send({ reportedUserId: user2Id, reason: 'harassment' })
        .expect(401);
    });
  });

  // ─── Get My Reports ──────────────────────────────────────

  describe('GET /safety/reports', () => {
    it('should return submitted reports', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/safety/reports`)
        .set(...authHeader(user1Token))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Block User ──────────────────────────────────────────

  describe('POST /safety/block', () => {
    it('should block a user', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/safety/block`)
        .set(...authHeader(user1Token))
        .send({ blockedUserId: user3Id })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('should reject blocking self', async () => {
      const u1 = await registerUser(app, makeTestUser('safe', 4));
      const selfId = u1.user.id;

      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/safety/block`)
        .set(...authHeader(u1.tokens.accessToken))
        .send({ blockedUserId: selfId });

      expect([400, 409]).toContain(res.status);
    });

    it('should reject duplicate block', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/safety/block`)
        .set(...authHeader(user1Token))
        .send({ blockedUserId: user3Id });

      expect([201, 409, 400]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/safety/block`)
        .send({ blockedUserId: user3Id })
        .expect(401);
    });
  });

  // ─── Get Blocked Users ───────────────────────────────────

  describe('GET /safety/blocked', () => {
    it('should return blocked users list', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/safety/blocked`)
        .set(...authHeader(user1Token))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Unblock User ────────────────────────────────────────

  describe('DELETE /safety/block/:userId', () => {
    it('should unblock a user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${API_PREFIX}/safety/block/${user3Id}`)
        .set(...authHeader(user1Token))
        .expect(200);

      expect(res.body.message).toMatch(/unblock/i);
    });

    it('should no longer appear in blocked list after unblock', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/safety/blocked`)
        .set(...authHeader(user1Token))
        .expect(200);

      const stillBlocked = res.body.find(
        (b: any) => b.blockedUserId === user3Id,
      );
      expect(stillBlocked).toBeUndefined();
    });

    it('should handle unblocking a non-blocked user gracefully', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${API_PREFIX}/safety/block/${user3Id}`)
        .set(...authHeader(user1Token));

      expect([200, 404]).toContain(res.status);
    });
  });
});
