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
import { CompanyGroup } from './company-group.entity';
import { User } from './user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_group_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legal_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  company_type: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  registration_number: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pan: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  gstin: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address_line1: string | null;

  @Column({ type: 'text', nullable: true })
  address_line2: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pincode: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'uuid', nullable: true })
  company_admin_user_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string | null;

  @ManyToOne(() => CompanyGroup)
  @JoinColumn({ name: 'company_group_id' })
  company_group: CompanyGroup;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'company_admin_user_id' })
  company_admin: User | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater: User | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
