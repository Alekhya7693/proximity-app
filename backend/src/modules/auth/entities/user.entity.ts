import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ length: 255, select: false })
  passwordHash: string;

  @Column({ unique: true, length: 30 })
  @Index()
  username: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ nullable: true, length: 20 })
  phone: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true, length: 6, select: false })
  verificationCode: string | null;

  @Column({ nullable: true, type: 'timestamp', select: false })
  verificationCodeExpiresAt: Date | null;

  @Column({ nullable: true, type: 'varchar', length: 512 })
  fcmToken: string | null;

  // PostGIS geography point for last known location
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  lastLocation: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLocationUpdatedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed full name helper (not stored)
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
