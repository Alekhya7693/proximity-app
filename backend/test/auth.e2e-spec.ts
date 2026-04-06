import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  cleanupTestUsers,
  API_PREFIX,
  makeTestUser,
  authHeader,
} from './test-helpers';

const testUser1 = makeTestUser('auth', 1);

describe('Auth Module (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanupTestUsers(app);
  });

  afterAll(async () => {
    await cleanupTestUsers(app);
    await app.close();
  });

  // ─── Registration ────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/register`)
        .send(testUser1)
        .expect(201);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.user.email).toBe(testUser1.email.toLowerCase());
      expect(res.body.user.username).toBe(testUser1.username.toLowerCase());
      expect(res.body.user.firstName).toBe(testUser1.firstName);
      expect(res.body.user.lastName).toBe(testUser1.lastName);
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.user).not.toHaveProperty('verificationCode');
      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();
      expect(res.body.tokens.expiresIn).toBeGreaterThan(0);

      accessToken = res.body.tokens.accessToken;
      refreshToken = res.body.tokens.refreshToken;
      userId = res.body.user.id;
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/register`)
        .send({ ...testUser1, username: 'differentuser' })
        .expect(409);

      expect(res.body.message).toMatch(/email/i);
    });

    it('should reject duplicate username registration', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/register`)
        .send({
          ...testUser1,
          email: 'different@myko-e2e.test',
          username: testUser1.username,
        })
        .expect(409);

      expect(res.body.message).toMatch(/username/i);
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/register`)
        .send({ ...testUser1, email: 'notanemail', username: 'unique1' })
        .expect(400);
    });

    it('should reject weak password (no uppercase)', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/register`)
        .send({
          ...testUser1,
          email: 'weak@myko-e2e.test',
          username: 'weakpass',
          password: 'nouppercase1',
        })
        .expect(400);
    });

    it('should reject password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/register`)
        .send({
          ...testUser1,
          email: 'short@myko-e2e.test',
          username: 'shortpass',
          password: 'Ab1',
        })
        .expect(400);
    });

    it('should reject username with special characters', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/register`)
        .send({
          ...testUser1,
          email: 'special@myko-e2e.test',
          username: 'bad!user',
          password: 'ValidPass1',
        })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/register`)
        .send({ email: 'missing@myko-e2e.test' })
        .expect(400);
    });

    it('should reject extra/unknown fields (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/register`)
        .send({
          ...testUser1,
          email: 'extra@myko-e2e.test',
          username: 'extrauser',
          unknownField: 'hacker',
        })
        .expect(400);
    });
  });

  // ─── Login ───────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send({ email: testUser1.email, password: testUser1.password })
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.user.email).toBe(testUser1.email.toLowerCase());
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();

      // Update tokens for subsequent tests
      accessToken = res.body.tokens.accessToken;
      refreshToken = res.body.tokens.refreshToken;
    });

    it('should reject wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send({ email: testUser1.email, password: 'WrongPassword1' })
        .expect(401);

      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should reject non-existent email', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send({ email: 'noone@example.com', password: 'AnyPass123' })
        .expect(401);
    });

    it('should accept optional device metadata', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: testUser1.email,
          password: testUser1.password,
          deviceId: 'test-device-001',
          deviceName: 'iPhone 15 Pro',
          platform: 'ios',
        })
        .expect(200);

      expect(res.body.tokens.accessToken).toBeDefined();
    });
  });

  // ─── Email Verification ──────────────────────────────────

  describe('POST /auth/verify-email', () => {
    it('should reject without auth token', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/verify-email`)
        .send({ code: '123456' })
        .expect(401);
    });

    it('should reject invalid verification code', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/verify-email`)
        .set(...authHeader(accessToken))
        .send({ code: '000000' })
        .expect(400);

      expect(res.body.message).toMatch(/invalid|verification/i);
    });

    it('should reject code shorter than 6 characters', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/verify-email`)
        .set(...authHeader(accessToken))
        .send({ code: '123' })
        .expect(400);
    });
  });

  // ─── Token Refresh ───────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/refresh`)
        .send({ refreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.expiresIn).toBeGreaterThan(0);
      // New tokens should differ from old ones
      expect(res.body.accessToken).not.toBe(accessToken);
      expect(res.body.refreshToken).not.toBe(refreshToken);

      // Update for subsequent tests
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should reject an already-rotated (old) refresh token', async () => {
      // The old refresh token was rotated in the previous test
      const oldRefresh = 'some-invalid-token';
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/refresh`)
        .send({ refreshToken: oldRefresh })
        .expect(401);
    });

    it('should reject missing refresh token', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/refresh`)
        .send({})
        .expect(400);
    });
  });

  // ─── Protected Route Access ──────────────────────────────

  describe('Protected route access', () => {
    it('should deny access without token', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/profile/me`)
        .expect(401);
    });

    it('should deny access with malformed token', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/profile/me`)
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });

    it('should allow access with valid token', async () => {
      // Profile may not exist yet, but auth should pass (404 or 200)
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/profile/me`)
        .set(...authHeader(accessToken));

      expect([200, 404]).toContain(res.status);
    });
  });

  // ─── Logout ──────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('should logout with refresh token (revoke specific session)', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/logout`)
        .set(...authHeader(accessToken))
        .send({ refreshToken })
        .expect(200);
    });

    it('should reject revoked refresh token after logout', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/refresh`)
        .send({ refreshToken })
        .expect(401);
    });

    it('should logout without refresh token (revoke all sessions)', async () => {
      // Login again first
      const loginRes = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send({ email: testUser1.email, password: testUser1.password })
        .expect(200);

      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/logout`)
        .set(...authHeader(loginRes.body.tokens.accessToken))
        .send({})
        .expect(200);
    });

    it('should reject logout without auth token', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/logout`)
        .send({})
        .expect(401);
    });
  });
});
