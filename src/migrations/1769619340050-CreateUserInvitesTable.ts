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
            isNullable: false,
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
            name: 'UQ_user_invites_email_company',
            columnNames: ['email', 'company_id'],
            isUnique: true,
          },
          {
            name: 'IDX_user_invites_email',
            columnNames: ['email'],
          },
          {
            name: 'IDX_user_invites_company_id',
            columnNames: ['company_id'],
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_invites');
  }
}
