import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';
import { Division } from './division.entity';
import { Department } from './department.entity';

@Entity('user_invites')
export class UserInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Link to company if invitation is for company level',
  })
  company_id: string | null;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Link to division if invitation is for division level',
  })
  division_id: string | null;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Link to department if invitation is for department level',
  })
  department_id: string | null;

  @Column({ type: 'uuid' })
  invited_by_user_id: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: 'Secure token for invite acceptance',
  })
  invite_token: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
    comment: "'pending', 'accepted', 'expired'",
  })
  invite_status: string;

  @Column({ type: 'timestamp', nullable: true, comment: 'Invite expiration timestamp' })
  expires_at: Date | null;

  @Column({ type: 'jsonb', nullable: true, comment: 'Flexible metadata storage' })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @ManyToOne(() => Division, { nullable: true })
  @JoinColumn({ name: 'division_id' })
  division: Division | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by_user_id' })
  invited_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
