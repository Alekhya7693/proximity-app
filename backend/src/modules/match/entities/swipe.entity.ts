import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

export enum SwipeDirection {
  LIKE = 'like',
  PASS = 'pass',
  SUPER_LIKE = 'super_like',
}

@Entity('swipes')
@Unique(['swiperId', 'swipedId'])
@Index(['swiperId', 'swipedId'])
export class SwipeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  swiperId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'swiperId' })
  swiper: UserEntity;

  @Column({ type: 'uuid' })
  @Index()
  swipedId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'swipedId' })
  swiped: UserEntity;

  @Column({
    type: 'enum',
    enum: SwipeDirection,
  })
  direction: SwipeDirection;

  @CreateDateColumn()
  createdAt: Date;
}
