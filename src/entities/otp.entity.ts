import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  otp_code: string;

  @Column({ type: 'varchar', length: 50 })
  otp_type: string;

  @Column({ type: 'boolean', default: false })
  is_used: boolean;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ type: 'integer', default: 3 })
  max_attempts: number;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
