import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddUserIdToOtpsTable1769626297140 implements MigrationInterface {
  name = 'AddUserIdToOtpsTable1769626297140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('otps');
    const hasUserIdColumn = table?.findColumnByName('user_id');

    // Add user_id column if it doesn't exist
    if (!hasUserIdColumn) {
      await queryRunner.addColumn(
        'otps',
        new TableColumn({
          name: 'user_id',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }

    // Check if foreign key already exists
    const foreignKeys = table?.foreignKeys || [];
    const hasForeignKey = foreignKeys.some(
      (fk) => fk.columnNames.includes('user_id') && fk.referencedTableName === 'users',
    );

    if (!hasForeignKey) {
      await queryRunner.createForeignKey(
        'otps',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Check if index already exists
    const indices = table?.indices || [];
    const hasIndex = indices.some((idx) => idx.name === 'IDX_otps_user_id');

    if (!hasIndex) {
      await queryRunner.createIndex(
        'otps',
        new TableIndex({
          name: 'IDX_otps_user_id',
          columnNames: ['user_id'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('otps');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('user_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('otps', foreignKey);
    }

    await queryRunner.dropIndex('otps', 'IDX_otps_user_id');
    await queryRunner.dropColumn('otps', 'user_id');
  }
}
