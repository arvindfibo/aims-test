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

export enum TenderStatus {
  QUOTED = 'Quoted',
  ONGOING = 'Ongoing',
  SUBMITTED = 'Submitted',
  WON = 'Won',
  LOST = 'Lost',
  CANCELLED = 'Cancelled',
}

export enum Currency {
  INR = 'INR',
  USD = 'USD',
}

@Entity('tenders')
export class Tender {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  tender_code: string;

  @Column({ type: 'varchar', length: 255 })
  authority: string;

  @Column({ type: 'text' })
  client_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nit_number: string | null;

  @Column({ type: 'text', nullable: true })
  misc_charges: string | null;

  @Column({ type: 'text' })
  name_of_work: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  tender_cost: number | null;

  @Column({ type: 'enum', enum: Currency, default: Currency.INR })
  tender_cost_currency: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  processing_fee: number | null;

  @Column({ type: 'enum', enum: Currency, default: Currency.INR })
  processing_fee_currency: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  emd: number | null;

  @Column({ type: 'enum', enum: Currency, default: Currency.INR })
  emd_currency: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  bank_charges: number | null;

  @Column({ type: 'enum', enum: Currency, default: Currency.INR })
  bank_charges_currency: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  documentation_charges: number | null;

  @Column({ type: 'enum', enum: Currency, default: Currency.INR })
  documentation_charges_currency: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0 })
  total_tender_value: number | null;

  @Column({ type: 'enum', enum: Currency, default: Currency.INR })
  total_tender_value_currency: Currency;

  @Column({ type: 'varchar', length: 255, nullable: true })
  last_date_of_submission: string | null;

  @Column({ type: 'text', nullable: true })
  mode_of_emd: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tender_status: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emd_status: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emd_returned: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string | null;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

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
