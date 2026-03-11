import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity, UserStatus } from './entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthResponse {
  user: Partial<UserEntity>;
  tokens: TokenPair;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check for existing email
    const existingEmail = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    // Check for existing username
    const existingUsername = await this.userRepository.findOne({
      where: { username: dto.username.toLowerCase() },
    });
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    // Create user
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      username: dto.username.toLowerCase(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || null,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      verificationCode,
      verificationCodeExpiresAt: verificationExpiry,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`New user registered: ${savedUser.id} (${savedUser.email})`);

    // Generate tokens
    const tokens = await this.generateTokenPair(savedUser);

    // Create session
    await this.createSession(savedUser.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(savedUser),
      tokens,
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<AuthResponse> {
    // Find user with password (password is excluded by default)
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email.toLowerCase() })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account has been suspended');
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Account no longer exists');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last active
    await this.userRepository.update(user.id, {
      lastActiveAt: new Date(),
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(user);

    // Create session
    await this.createSession(user.id, tokens.refreshToken, {
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      platform: dto.platform,
      ipAddress: ip,
      userAgent,
    });

    this.logger.log(`User logged in: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async verifyEmail(userId: string, code: string): Promise<{ verified: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      return { verified: true };
    }

    if (!user.verificationCode) {
      throw new BadRequestException('No verification code found. Request a new one.');
    }

    if (
      user.verificationCodeExpiresAt &&
      user.verificationCodeExpiresAt < new Date()
    ) {
      throw new BadRequestException('Verification code has expired');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.userRepository.update(userId, {
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
    });

    this.logger.log(`Email verified for user: ${userId}`);
    return { verified: true };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const session = await this.sessionRepository.findOne({
      where: { refreshToken, isActive: true },
      relations: ['user'],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      await this.sessionRepository.update(session.id, {
        isActive: false,
        revokedAt: new Date(),
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Rotate refresh token
    const newTokens = await this.generateTokenPair(session.user);

    // Revoke old session and create new one
    await this.sessionRepository.update(session.id, {
      isActive: false,
      revokedAt: new Date(),
    });

    await this.createSession(session.userId, newTokens.refreshToken, {
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      platform: session.platform,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return newTokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Revoke specific session
      await this.sessionRepository.update(
        { userId, refreshToken, isActive: true },
        { isActive: false, revokedAt: new Date() },
      );
    } else {
      // Revoke all sessions
      await this.sessionRepository.update(
        { userId, isActive: true },
        { isActive: false, revokedAt: new Date() },
      );
    }

    this.logger.log(`User logged out: ${userId}`);
  }

  // ─── Private Helpers ───────────────────────────────────────

  private async generateTokenPair(user: UserEntity): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessExpiration = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION',
      '15m',
    );
    const refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: accessExpiration }),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        { expiresIn: refreshExpiration },
      ),
    ]);

    // Parse expiration to seconds for client convenience
    const expiresIn = this.parseExpirationToSeconds(accessExpiration);

    return { accessToken, refreshToken, expiresIn };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    metadata?: {
      deviceId?: string;
      deviceName?: string;
      platform?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<SessionEntity> {
    const refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + this.parseExpirationToSeconds(refreshExpiration),
    );

    const session = this.sessionRepository.create({
      userId,
      refreshToken,
      expiresAt,
      deviceId: metadata?.deviceId || null,
      deviceName: metadata?.deviceName || null,
      platform: metadata?.platform || null,
      ipAddress: metadata?.ipAddress || null,
      userAgent: metadata?.userAgent || null,
    });

    return this.sessionRepository.save(session);
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  private sanitizeUser(user: UserEntity): Partial<UserEntity> {
    const { passwordHash, verificationCode, verificationCodeExpiresAt, ...safe } =
      user;
    return safe;
  }
}
