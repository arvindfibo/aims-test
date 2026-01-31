import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserRolesTable1769618961336 implements MigrationInterface {
  name = 'CreateUserRolesTable1769618961336';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Link to specific company (if applicable)',
          },
          {
            name: 'division_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Link to specific division (if applicable)',
          },
          {
            name: 'department_id',
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
            name: 'UQ_user_roles_user_role_company',
            columnNames: ['user_id', 'role_id', 'company_id'],
            isUnique: true,
          },
          {
            name: 'IDX_user_roles_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_user_roles_role_id',
            columnNames: ['role_id'],
          },
          {
            name: 'IDX_user_roles_company_id',
            columnNames: ['company_id'],
          },
          {
            name: 'IDX_user_roles_division_id',
            columnNames: ['division_id'],
          },
          {
            name: 'IDX_user_roles_department_id',
            columnNames: ['department_id'],
          },
          {
            name: 'IDX_user_roles_user_role',
            columnNames: ['user_id', 'role_id'],
          },
          {
            name: 'IDX_user_roles_user_company',
            columnNames: ['user_id', 'company_id'],
          },
          {
            name: 'IDX_user_roles_user_division',
            columnNames: ['user_id', 'division_id'],
          },
          {
            name: 'IDX_user_roles_user_department',
            columnNames: ['user_id', 'department_id'],
          },
          {
            name: 'IDX_user_roles_created_by',
            columnNames: ['created_by'],
          },
          {
            name: 'IDX_user_roles_updated_by',
            columnNames: ['updated_by'],
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['role_id'],
            referencedTableName: 'roles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['company_id'],
            referencedTableName: 'companies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['division_id'],
            referencedTableName: 'divisions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['department_id'],
            referencedTableName: 'departments',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
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
    await queryRunner.dropTable('user_roles');
  }
}
