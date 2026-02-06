import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCompaniesTable1769618080627 implements MigrationInterface {
  name = 'CreateCompaniesTable1769618080627';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'company_group_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'legal_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'company_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: "e.g., 'govt', 'vendor', 'internal', etc.",
          },
          {
            name: 'registration_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'pan',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'gstin',
            type: 'varchar',
            length: '15',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'website',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'address_line1',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'address_line2',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'pincode',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'company_admin_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Flexible metadata storage',
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
            name: 'IDX_companies_company_group_id',
            columnNames: ['company_group_id'],
          },
          {
            name: 'IDX_companies_name',
            columnNames: ['name'],
          },
          {
            name: 'IDX_companies_company_type',
            columnNames: ['company_type'],
          },
          {
            name: 'IDX_companies_registration_number',
            columnNames: ['registration_number'],
          },
          {
            name: 'IDX_companies_pan',
            columnNames: ['pan'],
          },
          {
            name: 'IDX_companies_gstin',
            columnNames: ['gstin'],
          },
          {
            name: 'IDX_companies_email',
            columnNames: ['email'],
          },
          {
            name: 'IDX_companies_company_admin_id',
            columnNames: ['company_admin_id'],
          },
          {
            name: 'IDX_companies_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'IDX_companies_is_verified',
            columnNames: ['is_verified'],
          },
          {
            name: 'IDX_companies_created_by',
            columnNames: ['created_by'],
          },
          {
            name: 'IDX_companies_updated_by',
            columnNames: ['updated_by'],
          },
        ],
        foreignKeys: [
          {
            columnNames: ['company_group_id'],
            referencedTableName: 'company_groups',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['company_admin_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('companies');
  }
}
