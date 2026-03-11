import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { MessageEntity } from './message.entity';

export enum ChatStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

@Entity('chats')
@Index(['participant1Id', 'participant2Id'], { unique: true })
export class ChatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  participant1Id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant1Id' })
  participant1: UserEntity;

  @Column({ type: 'uuid' })
  @Index()
  participant2Id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant2Id' })
  participant2: UserEntity;

  @Column({
    type: 'enum',
    enum: ChatStatus,
    default: ChatStatus.ACTIVE,
  })
  status: ChatStatus;

  @Column({ type: 'uuid', nullable: true })
  matchId: string | null;

  @Column({ type: 'text', nullable: true })
  lastMessageText: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: 'int', default: 0 })
  unreadCount1: number; // Unread count for participant1

  @Column({ type: 'int', default: 0 })
  unreadCount2: number; // Unread count for participant2

  @OneToMany(() => MessageEntity, (message) => message.chat)
  messages: MessageEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
