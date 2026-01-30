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
  NOT_FILLED = 'Not Filled',
  ON_GOING = 'On Going',
  L1 = 'L-1',
  L1_WORK_ALLOTED = 'L-1(work alloted to Us)',
  L2 = 'L-2',
  L3 = 'L-3',
  QUOTED = 'Quoted',
  SUBMITTED = 'Submitted',
  WON = 'Won',
  LOST = 'Lost',
  CANCELLED = 'Cancelled',
}

export enum EmdStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  RETURNED = 'Returned',
  NOT_APPLICABLE = 'Not Applicable',
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

  @Column({ type: 'timestamp', nullable: true })
  last_date_of_submission: Date | null;

  @Column({ type: 'text', nullable: true })
  mode_of_emd: string | null;

  @Column({ type: 'enum', enum: TenderStatus, nullable: true })
  tender_status: TenderStatus | null;

  @Column({ type: 'enum', enum: EmdStatus, nullable: true })
  emd_status: EmdStatus | null;

  @Column({ type: 'boolean', default: false })
  emd_returned: boolean;

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
