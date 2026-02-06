import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserInvitesTable1769619340050 implements MigrationInterface {
  name = 'CreateUserInvitesTable1769619340050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_invites',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Link to company if invitation is for company level',
          },
          {
            name: 'division_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Link to division if invitation is for division level',
          },
          {
            name: 'department_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Link to department if invitation is for department level',
          },
          {
            name: 'invited_by_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'invite_token',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
            comment: 'Secure token for invite acceptance',
          },
          {
            name: 'invite_status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
            isNullable: false,
            comment: "'pending', 'accepted', 'expired'",
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Invite expiration timestamp',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Flexible metadata storage',
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
            name: 'IDX_user_invites_email',
            columnNames: ['email'],
          },
          {
            name: 'IDX_user_invites_company_id',
            columnNames: ['company_id'],
          },
          {
            name: 'IDX_user_invites_division_id',
            columnNames: ['division_id'],
          },
          {
            name: 'IDX_user_invites_department_id',
            columnNames: ['department_id'],
          },
          {
            name: 'IDX_user_invites_invited_by_user_id',
            columnNames: ['invited_by_user_id'],
          },
          {
            name: 'IDX_user_invites_invite_status',
            columnNames: ['invite_status'],
          },
          {
            name: 'IDX_user_invites_invite_token',
            columnNames: ['invite_token'],
            isUnique: true,
          },
          {
            name: 'IDX_user_invites_expires_at',
            columnNames: ['expires_at'],
          },
        ],
        foreignKeys: [
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
            columnNames: ['invited_by_user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Add check constraint to ensure exactly one resource ID is set
    await queryRunner.query(`
      ALTER TABLE user_invites
      ADD CONSTRAINT chk_user_invites_exactly_one_resource
      CHECK (
        (company_id IS NOT NULL AND division_id IS NULL AND department_id IS NULL) OR
        (company_id IS NULL AND division_id IS NOT NULL AND department_id IS NULL) OR
        (company_id IS NULL AND division_id IS NULL AND department_id IS NOT NULL)
      )
    `);

    // Create partial unique indexes for better constraint handling
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_user_invites_email_company_partial
      ON user_invites(email, company_id)
      WHERE company_id IS NOT NULL AND deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_user_invites_email_division_partial
      ON user_invites(email, division_id)
      WHERE division_id IS NOT NULL AND deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_user_invites_email_department_partial
      ON user_invites(email, department_id)
      WHERE department_id IS NOT NULL AND deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_invites');
  }
}
