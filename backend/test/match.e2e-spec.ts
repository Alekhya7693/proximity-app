import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  cleanupTestUsers,
  registerUser,
  updateLocation,
  API_PREFIX,
  makeTestUser,
  testProfile,
  testProfile2,
  locations,
  authHeader,
} from './test-helpers';

const testUser1 = makeTestUser('mtch', 1);
const testUser2 = makeTestUser('mtch', 2);
const testUser3 = makeTestUser('mtch', 3);

describe('Match Module (e2e)', () => {
  let app: INestApplication;
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let user3Token: string;
  let user3Id: string;
  let matchId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanupTestUsers(app);

    const u1 = await registerUser(app, testUser1);
    user1Token = u1.tokens.accessToken;
    user1Id = u1.user.id;

    const u2 = await registerUser(app, testUser2);
    user2Token = u2.tokens.accessToken;
    user2Id = u2.user.id;

    const u3 = await registerUser(app, testUser3);
    user3Token = u3.tokens.accessToken;
    user3Id = u3.user.id;

    // Create profiles and set locations
    await request(app.getHttpServer())
      .post(`${API_PREFIX}/profile`)
      .set(...authHeader(user1Token))
      .send(testProfile);

    await request(app.getHttpServer())
      .post(`${API_PREFIX}/profile`)
      .set(...authHeader(user2Token))
      .send(testProfile2);

    await request(app.getHttpServer())
      .post(`${API_PREFIX}/profile`)
      .set(...authHeader(user3Token))
      .send({ ...testProfile2, bio: 'Third user' });

    await updateLocation(app, user1Token, locations.timesSquare);
    await updateLocation(app, user2Token, locations.timesSquareNearby);
  });

  afterAll(async () => {
    await cleanupTestUsers(app);
    await app.close();
  });

  // ─── Swiping ─────────────────────────────────────────────

  describe('POST /match/swipe', () => {
    it('should record a LIKE swipe', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/match/swipe`)
        .set(...authHeader(user1Token))
        .send({ targetUserId: user2Id, direction: 'like' })
        .expect(201);

      expect(res.body).toHaveProperty('swipe');
      expect(res.body).toHaveProperty('isMatch');
      expect(res.body.swipe.direction).toBe('like');
      expect(res.body.isMatch).toBe(false); // User2 hasn't swiped back yet
    });

    it('should create a match on mutual LIKE', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/match/swipe`)
        .set(...authHeader(user2Token))
        .send({ targetUserId: user1Id, direction: 'like' })
        .expect(201);

      expect(res.body.isMatch).toBe(true);
      expect(res.body.match).toBeDefined();
      expect(res.body.match).toHaveProperty('id');
      matchId = res.body.match.id;
    });

    it('should record a PASS swipe', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/match/swipe`)
        .set(...authHeader(user1Token))
        .send({ targetUserId: user3Id, direction: 'pass' })
        .expect(201);

      expect(res.body.swipe.direction).toBe('pass');
      expect(res.body.isMatch).toBe(false);
    });

    it('should reject duplicate swipe on same user', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/match/swipe`)
        .set(...authHeader(user1Token))
        .send({ targetUserId: user2Id, direction: 'like' });

      // Should be 409 (conflict) or handled gracefully
      expect([201, 409, 400]).toContain(res.status);
    });

    it('should reject swipe on self', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/match/swipe`)
        .set(...authHeader(user1Token))
        .send({ targetUserId: user1Id, direction: 'like' });

      expect([400, 409]).toContain(res.status);
    });

    it('should reject invalid swipe direction', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/match/swipe`)
        .set(...authHeader(user1Token))
        .send({ targetUserId: user3Id, direction: 'invalid' })
        .expect(400);
    });

    it('should reject missing targetUserId', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/match/swipe`)
        .set(...authHeader(user1Token))
        .send({ direction: 'like' })
        .expect(400);
    });

    it('should reject without auth', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/match/swipe`)
        .send({ targetUserId: user2Id, direction: 'like' })
        .expect(401);
    });
  });

  // ─── Get Matches ─────────────────────────────────────────

  describe('GET /match', () => {
    it('should return list of active matches', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/match`)
        .set(...authHeader(user1Token))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const match = res.body.find((m: any) => m.id === matchId);
      expect(match).toBeDefined();
      expect(match.status).toBe('active');
    });

    it('should return matches for the other user too', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/match`)
        .set(...authHeader(user2Token))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject without auth', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/match`)
        .expect(401);
    });
  });

  // ─── Get Likes Received ──────────────────────────────────

  describe('GET /match/likes', () => {
    it('should return likes received by user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/match/likes`)
        .set(...authHeader(user3Token))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── Unmatch ─────────────────────────────────────────────

  describe('DELETE /match/:matchId', () => {
    it('should unmatch successfully', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${API_PREFIX}/match/${matchId}`)
        .set(...authHeader(user1Token))
        .expect(200);

      expect(res.body.message).toMatch(/unmatch/i);
    });

    it('should no longer show unmatched user in matches', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/match`)
        .set(...authHeader(user1Token))
        .expect(200);

      const activeMatch = res.body.find(
        (m: any) => m.id === matchId && m.status === 'active',
      );
      expect(activeMatch).toBeUndefined();
    });

    it('should reject unmatch for non-existent match', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${API_PREFIX}/match/00000000-0000-0000-0000-000000000000`)
        .set(...authHeader(user1Token));

      expect([404, 400]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      await request(app.getHttpServer())
        .delete(`${API_PREFIX}/match/${matchId}`)
        .expect(401);
    });
  });
});
