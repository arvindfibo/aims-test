import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class ChangeRoleIdToUuid1769720045173 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop foreign key constraint from user_roles to roles
    const userRolesTable = await queryRunner.getTable('user_roles');
    const foreignKey = userRolesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('role_id') !== -1 && fk.referencedTableName === 'roles',
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('user_roles', foreignKey);
    }

    // Step 2: Add temporary UUID column to roles table
    await queryRunner.addColumn(
      'roles',
      new TableColumn({
        name: 'id_new',
        type: 'uuid',
        isPrimary: false,
        isNullable: true,
        generationStrategy: 'uuid',
        default: 'gen_random_uuid()',
      }),
    );

    // Step 3: Generate UUIDs for existing roles and update the new column
    await queryRunner.query(`
      UPDATE roles 
      SET id_new = gen_random_uuid()
      WHERE id_new IS NULL
    `);

    // Step 4: Create a mapping table to store old_id -> new_uuid
    await queryRunner.query(`
      CREATE TEMP TABLE role_id_mapping AS
      SELECT id AS old_id, id_new AS new_uuid
      FROM roles
    `);

    // Step 5: Add temporary UUID column to user_roles table
    await queryRunner.addColumn(
      'user_roles',
      new TableColumn({
        name: 'role_id_new',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Step 6: Map old integer role_ids to new UUIDs in user_roles
    await queryRunner.query(`
      UPDATE user_roles ur
      SET role_id_new = mapping.new_uuid
      FROM role_id_mapping mapping
      WHERE ur.role_id = mapping.old_id
    `);

    // Step 7: Drop primary key constraint before dropping the column
    await queryRunner.query(`ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_pkey`);

    // Step 8: Drop old integer columns
    await queryRunner.dropColumn('roles', 'id');
    await queryRunner.dropColumn('user_roles', 'role_id');

    // Step 9: Rename new UUID columns to original names
    await queryRunner.renameColumn('roles', 'id_new', 'id');
    await queryRunner.renameColumn('user_roles', 'role_id_new', 'role_id');

    // Step 10: Make roles.id not nullable and set as primary key
    await queryRunner.query(`ALTER TABLE roles ALTER COLUMN id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE roles ADD PRIMARY KEY (id)`);

    // Step 11: Make user_roles.role_id not nullable
    await queryRunner.query(`ALTER TABLE user_roles ALTER COLUMN role_id SET NOT NULL`);

    // Step 12: Recreate foreign key constraint
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Step 13: Drop the temporary mapping table (it's a temp table, so it will be dropped automatically)
    // But we'll explicitly drop it for clarity
    await queryRunner.query(`DROP TABLE IF EXISTS role_id_mapping`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop foreign key constraint
    const userRolesTable = await queryRunner.getTable('user_roles');
    const foreignKey = userRolesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('role_id') !== -1 && fk.referencedTableName === 'roles',
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('user_roles', foreignKey);
    }

    // Step 2: Add temporary integer column to roles
    await queryRunner.addColumn(
      'roles',
      new TableColumn({
        name: 'id_old',
        type: 'integer',
        isPrimary: false,
        isNullable: true,
        isGenerated: true,
        generationStrategy: 'increment',
      }),
    );

    // Step 3: Generate sequential IDs for roles
    await queryRunner.query(`
      UPDATE roles
      SET id_old = row_number() OVER (ORDER BY created_at)
    `);

    // Step 4: Create mapping table
    await queryRunner.query(`
      CREATE TEMP TABLE role_id_mapping AS
      SELECT id AS old_uuid, id_old AS new_id
      FROM roles
    `);

    // Step 5: Add temporary integer column to user_roles
    await queryRunner.addColumn(
      'user_roles',
      new TableColumn({
        name: 'role_id_old',
        type: 'integer',
        isNullable: true,
      }),
    );

    // Step 6: Map UUIDs back to integers
    await queryRunner.query(`
      UPDATE user_roles ur
      SET role_id_old = mapping.new_id
      FROM role_id_mapping mapping
      WHERE ur.role_id = mapping.old_uuid
    `);

    // Step 7: Drop primary key constraint before dropping the column
    await queryRunner.query(`ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_pkey`);

    // Step 8: Drop UUID columns
    await queryRunner.dropColumn('roles', 'id');
    await queryRunner.dropColumn('user_roles', 'role_id');

    // Step 9: Rename old columns back
    await queryRunner.renameColumn('roles', 'id_old', 'id');
    await queryRunner.renameColumn('user_roles', 'role_id_old', 'role_id');

    // Step 10: Make roles.id not nullable and set as primary key
    await queryRunner.query(`ALTER TABLE roles ALTER COLUMN id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE roles ADD PRIMARY KEY (id)`);

    // Step 11: Make user_roles.role_id not nullable
    await queryRunner.query(`ALTER TABLE user_roles ALTER COLUMN role_id SET NOT NULL`);

    // Step 12: Recreate foreign key
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }
}
