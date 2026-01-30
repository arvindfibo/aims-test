import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'varchar', length: 100 })
  project_code: string;

  @Column({ type: 'varchar', length: 255 })
  project_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  work_order_number_date: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_of_work: string | null;

  @Column({ type: 'date', nullable: true })
  stipulated_comencement_date: Date | null;

  @Column({ type: 'date', nullable: true })
  actual_comencement_date: Date | null;

  @Column({ type: 'date', nullable: true })
  stipulated_completion_date: Date | null;

  @Column({ type: 'date', nullable: true })
  actual_completion_date: Date | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  initial_contract_value: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  completion_contract_value: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  project_manager: string | null;

  @Column({
    type: 'enum',
    enum: ['OPEN', 'COMPLETED', 'RUNNING'],
    enumName: 'projects_status_enum',
  })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remarks: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  client_representative_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  client_representative_phone: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  balance_due_against_invoice: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  holdover: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  security: string | null;

  @Column({
    type: 'enum',
    enum: ['INR', 'USD'],
    enumName: 'projects_currency_enum',
  })
  currency: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
