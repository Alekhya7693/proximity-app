import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum IntentionType {
  DATING = 'dating',
  FRIENDSHIP = 'friendship',
  NETWORKING = 'networking',
  ALL = 'all',
}

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  @Index()
  userId: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender | null;

  @Column({
    type: 'enum',
    enum: IntentionType,
    default: IntentionType.ALL,
  })
  intention: IntentionType;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  interests: string[] | null;

  @Column({ length: 255, nullable: true })
  occupation: string | null;

  @Column({ length: 255, nullable: true })
  company: string | null;

  @Column({ length: 255, nullable: true })
  education: string | null;

  @Column({ type: 'int', nullable: true })
  heightCm: number | null;

  @Column({ length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'simple-json', nullable: true })
  prompts: { question: string; answer: string }[] | null;

  @Column({ type: 'simple-json', nullable: true })
  preferences: {
    ageMin?: number;
    ageMax?: number;
    maxDistanceKm?: number;
    genders?: Gender[];
    intentions?: IntentionType[];
  } | null;

  @Column({ type: 'int', default: 0 })
  profileCompleteness: number;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: false })
  isPremium: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
