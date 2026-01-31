import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDepartmentsTable1769618600151 implements MigrationInterface {
  name = 'CreateDepartmentsTable1769618600151';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'departments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'division_id',
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
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'department_admin_user_id',
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
            name: 'UQ_departments_division_code',
            columnNames: ['division_id', 'code'],
            isUnique: true,
          },
          {
            name: 'UQ_departments_division_name',
            columnNames: ['division_id', 'name'],
            isUnique: true,
          },
          {
            name: 'IDX_departments_division_id',
            columnNames: ['division_id'],
          },
          {
            name: 'IDX_departments_department_admin_user_id',
            columnNames: ['department_admin_user_id'],
          },
          {
            name: 'IDX_departments_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'IDX_departments_created_by',
            columnNames: ['created_by'],
          },
          {
            name: 'IDX_departments_updated_by',
            columnNames: ['updated_by'],
          },
        ],
        foreignKeys: [
          {
            columnNames: ['division_id'],
            referencedTableName: 'divisions',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['department_admin_user_id'],
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
    await queryRunner.dropTable('departments');
  }
}
