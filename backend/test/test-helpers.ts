import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../src/modules/auth/entities/user.entity';
import { SessionEntity } from '../src/modules/auth/entities/session.entity';
import { ProfileEntity } from '../src/modules/profile/entities/profile.entity';
import { MatchEntity } from '../src/modules/match/entities/match.entity';
import { SwipeEntity } from '../src/modules/match/entities/swipe.entity';
import { ChatEntity } from '../src/modules/chat/entities/chat.entity';
import { MessageEntity } from '../src/modules/chat/entities/message.entity';

export const API_PREFIX = '/api/v1';

// ─── Test User Factory ─────────────────────────────────────

/**
 * Generate unique test user data per suite to avoid cross-suite conflicts.
 * @param prefix - unique per test suite (e.g., 'auth', 'profile', 'match')
 * @param index - user index within the suite (1, 2, 3)
 */
export function makeTestUser(prefix: string, index: number) {
  const names = [
    { firstName: 'Alice', lastName: 'Tester', dob: '1995-06-15' },
    { firstName: 'Bob', lastName: 'Tester', dob: '1993-03-20' },
    { firstName: 'Carol', lastName: 'Tester', dob: '1998-11-01' },
  ];
  const n = names[(index - 1) % names.length];
  return {
    email: `${prefix}_user${index}@myko-e2e.test`,
    password: 'TestPass1234',
    username: `${prefix}_user${index}`,
    firstName: n.firstName,
    lastName: n.lastName,
    dateOfBirth: n.dob,
  };
}

// Legacy aliases (used by auth spec which manages its own users)
export const testUser1 = makeTestUser('legacy', 1);
export const testUser2 = makeTestUser('legacy', 2);
export const testUser3 = makeTestUser('legacy', 3);

// ─── App Bootstrap ─────────────────────────────────────────

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix(API_PREFIX.replace(/^\//, ''));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  return app;
}

// ─── Auth Helpers ──────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisteredUser {
  user: Partial<UserEntity>;
  tokens: AuthTokens;
}

export async function registerUser(
  app: INestApplication,
  userData: typeof testUser1,
): Promise<RegisteredUser> {
  const res = await request(app.getHttpServer())
    .post(`${API_PREFIX}/auth/register`)
    .send(userData)
    .expect(201);

  return res.body;
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<RegisteredUser> {
  const res = await request(app.getHttpServer())
    .post(`${API_PREFIX}/auth/login`)
    .send({ email, password })
    .expect(200);

  return res.body;
}

export function authHeader(accessToken: string): [string, string] {
  return ['Authorization', `Bearer ${accessToken}`];
}

// ─── Cleanup ───────────────────────────────────────────────

export async function cleanupDatabase(app: INestApplication): Promise<void> {
  const repos = [
    getRepositoryToken(MessageEntity),
    getRepositoryToken(ChatEntity),
    getRepositoryToken(SwipeEntity),
    getRepositoryToken(MatchEntity),
    getRepositoryToken(ProfileEntity),
    getRepositoryToken(SessionEntity),
    getRepositoryToken(UserEntity),
  ];

  for (const token of repos) {
    try {
      const repo: Repository<any> = app.get(token);
      // Delete test data only (matching our test email domain)
      await repo
        .createQueryBuilder()
        .delete()
        .where('1=1')
        .execute()
        .catch(() => {
          // Some entities may not have data, ignore
        });
    } catch {
      // Repository not found or not accessible, skip
    }
  }
}

export async function cleanupTestUsers(app: INestApplication): Promise<void> {
  try {
    const userRepo: Repository<UserEntity> = app.get(
      getRepositoryToken(UserEntity),
    );
    await userRepo
      .createQueryBuilder()
      .delete()
      .where('email LIKE :pattern', { pattern: '%@myko-e2e.test' })
      .execute();
  } catch {
    // Ignore cleanup errors
  }
}

// ─── Location Helpers ──────────────────────────────────────

/**
 * Update user location. Does not throw on PostGIS errors (500).
 * Returns true if the update succeeded, false otherwise.
 */
export async function updateLocation(
  app: INestApplication,
  token: string,
  coords: { latitude: number; longitude: number },
): Promise<boolean> {
  const res = await request(app.getHttpServer())
    .post(`${API_PREFIX}/location/update`)
    .set(...authHeader(token))
    .send(coords);
  return res.status === 200 || res.status === 201;
}

export const locations = {
  // Two points ~100m apart in NYC (Times Square area)
  timesSquare: { latitude: 40.758, longitude: -73.9855 },
  timesSquareNearby: { latitude: 40.7589, longitude: -73.9851 },
  // Point ~5km away (Central Park North)
  centralParkNorth: { latitude: 40.7968, longitude: -73.9519 },
  // Point ~50km away (Stamford, CT)
  stamford: { latitude: 41.0534, longitude: -73.5387 },
};

// ─── Profile Helpers ───────────────────────────────────────

export const testProfile = {
  bio: 'E2E test user bio — love hiking and coding!',
  gender: 'male',
  intention: 'all',
  occupation: 'Software Engineer',
  company: 'MYKO Inc.',
  education: 'MIT',
  heightCm: 180,
  city: 'New York',
  interests: ['hiking', 'coding', 'music'],
};

export const testProfile2 = {
  bio: 'Second test user — into photography and travel',
  gender: 'female',
  intention: 'all',
  occupation: 'Photographer',
  company: 'Freelance',
  education: 'NYU',
  heightCm: 165,
  city: 'New York',
  interests: ['photography', 'travel', 'coding'],
};
