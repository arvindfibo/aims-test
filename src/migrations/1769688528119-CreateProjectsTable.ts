import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProjectsTable1769688528119 implements MigrationInterface {
  name = 'CreateProjectsTable1769688528119';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'projects',
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
            name: 'project_code',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'project_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'work_order_number_date',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'name_of_work',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stipulated_comencement_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'actual_comencement_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'stipulated_completion_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'actual_completion_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'initial_contract_value',
            type: 'numeric',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'completion_contract_value',
            type: 'numeric',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'project_manager',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['OPEN', 'COMPLETED', 'RUNNING'],
            enumName: 'projects_status_enum',
            isNullable: false,
          },
          {
            name: 'remarks',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'client_representative_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'client_representative_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'balance_due_against_invoice',
            type: 'numeric',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'holdover',
            type: 'numeric',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'security',
            type: 'numeric',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'enum',
            enum: ['INR', 'USD'],
            enumName: 'projects_currency_enum',
            isNullable: false,
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
            name: 'IDX_projects_company_id',
            columnNames: ['company_id'],
          },
          {
            name: 'IDX_projects_project_code',
            columnNames: ['project_code'],
          },
          {
            name: 'IDX_projects_status',
            columnNames: ['status'],
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
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('projects');
    await queryRunner.query('DROP TYPE IF EXISTS "projects_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "projects_currency_enum"');
  }
}
