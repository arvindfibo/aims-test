import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTendersTable1769673033843 implements MigrationInterface {
  name = 'CreateTendersTable1769673033843';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "currency_enum" AS ENUM ('INR', 'USD');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "tender_status_enum" AS ENUM (
          'Not Filled',
          'On Going',
          'L-1',
          'L-1(work alloted to Us)',
          'L-2',
          'L-3',
          'L-4',
          'Quoted',
          'Submitted',
          'Won',
          'Lost',
          'Cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "emd_status_enum" AS ENUM (
          'Pending',
          'Paid',
          'Returned',
          'Not Applicable'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'tenders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tender_code',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'authority',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'client_name',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'nit_number',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'misc_charges',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'name_of_work',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'tender_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
            isNullable: true,
          },
          {
            name: 'tender_cost_currency',
            type: 'varchar',
            length: '10',
            default: "'INR'",
            isNullable: false,
          },
          {
            name: 'processing_fee',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
            isNullable: true,
          },
          {
            name: 'processing_fee_currency',
            type: 'varchar',
            length: '10',
            default: "'INR'",
            isNullable: false,
          },
          {
            name: 'emd',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
            isNullable: true,
          },
          {
            name: 'emd_currency',
            type: 'varchar',
            length: '10',
            default: "'INR'",
            isNullable: false,
          },
          {
            name: 'bank_charges',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
            isNullable: true,
          },
          {
            name: 'bank_charges_currency',
            type: 'varchar',
            length: '10',
            default: "'INR'",
            isNullable: false,
          },
          {
            name: 'documentation_charges',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
            isNullable: true,
          },
          {
            name: 'documentation_charges_currency',
            type: 'varchar',
            length: '10',
            default: "'INR'",
            isNullable: false,
          },
          {
            name: 'total_tender_value',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
            isNullable: true,
          },
          {
            name: 'total_tender_value_currency',
            type: 'varchar',
            length: '10',
            default: "'INR'",
            isNullable: false,
          },
          {
            name: 'last_date_of_submission',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'mode_of_emd',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tender_status',
            type: 'tender_status_enum',
            isNullable: true,
          },
          {
            name: 'emd_status',
            type: 'emd_status_enum',
            isNullable: true,
          },
          {
            name: 'emd_returned',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_tenders_company_id',
            columnNames: ['company_id'],
          },
          {
            name: 'IDX_tenders_tender_code',
            columnNames: ['tender_code'],
          },
          {
            name: 'IDX_tenders_authority',
            columnNames: ['authority'],
          },
          {
            name: 'IDX_tenders_tender_status',
            columnNames: ['tender_status'],
          },
          {
            name: 'IDX_tenders_created_by',
            columnNames: ['created_by'],
          },
          {
            name: 'IDX_tenders_updated_by',
            columnNames: ['updated_by'],
          },
        ],
        foreignKeys: [
          {
            columnNames: ['company_id'],
            referencedTableName: 'companies',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['created_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['updated_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Add check constraints for currency fields
    await queryRunner.query(`
      ALTER TABLE "tenders"
      ADD CONSTRAINT "CHK_tender_cost_currency" CHECK (tender_cost_currency IN ('INR', 'USD'))
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      ADD CONSTRAINT "CHK_processing_fee_currency" CHECK (processing_fee_currency IN ('INR', 'USD'))
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      ADD CONSTRAINT "CHK_emd_currency" CHECK (emd_currency IN ('INR', 'USD'))
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      ADD CONSTRAINT "CHK_bank_charges_currency" CHECK (bank_charges_currency IN ('INR', 'USD'))
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      ADD CONSTRAINT "CHK_documentation_charges_currency" CHECK (documentation_charges_currency IN ('INR', 'USD'))
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      ADD CONSTRAINT "CHK_total_tender_value_currency" CHECK (total_tender_value_currency IN ('INR', 'USD'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenders');
    await queryRunner.query(`DROP TYPE IF EXISTS "currency_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tender_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "emd_status_enum"`);
  }
}
