import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

export enum MatchStatus {
  ACTIVE = 'active',
  UNMATCHED = 'unmatched',
  BLOCKED = 'blocked',
}

@Entity('matches')
@Index(['user1Id', 'user2Id'], { unique: true })
export class MatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user1Id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user1Id' })
  user1: UserEntity;

  @Column({ type: 'uuid' })
  @Index()
  user2Id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user2Id' })
  user2: UserEntity;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.ACTIVE,
  })
  status: MatchStatus;

  @Column({ type: 'float', nullable: true })
  distanceAtMatchKm: number | null;

  @CreateDateColumn()
  matchedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  unmatchedAt: Date | null;
}
