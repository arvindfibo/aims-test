import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOtpTable1769622689892 implements MigrationInterface {
  name = 'CreateOtpTable1769622689892';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'otps',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'otp_code',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'otp_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: "e.g., 'email_verification',  'password_reset'",
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
            comment: 'OTP expiration timestamp',
          },
          {
            name: 'attempts',
            type: 'integer',
            default: 0,
            isNullable: false,
            comment: 'Number of verification attempts',
          },
          {
            name: 'max_attempts',
            type: 'integer',
            default: 3,
            isNullable: false,
            comment: 'Maximum allowed verification attempts',
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
        ],
        indices: [
          {
            name: 'IDX_otps_otp_code',
            columnNames: ['otp_code'],
          },
          {
            name: 'IDX_otps_otp_type',
            columnNames: ['otp_type'],
          },
          {
            name: 'IDX_otps_is_used',
            columnNames: ['is_used'],
          },
          {
            name: 'IDX_otps_expires_at',
            columnNames: ['expires_at'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('otps');
  }
}
