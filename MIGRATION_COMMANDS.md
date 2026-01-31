# TypeORM Migration Commands

## 📝 Create & Generate Migrations

### Create Empty Migration

```bash
pnpm migration:create src/migrations/MigrationName
```

Creates an empty migration file that you can manually edit.

### Generate Migration from Entities

```bash
pnpm migration:generate src/migrations/MigrationName
```

Auto-generates migration based on changes in your entities.

---

## ▶️ Run Migrations

### Apply All Pending Migrations

```bash
pnpm migration:run
```

Executes all migrations that haven't been applied yet.

---

## ◀️ Revert & Rollback Migrations

### Revert Last Migration

```bash
pnpm migration:revert
```

Undoes the most recently applied migration by running its `down()` method.

### Rollback (Alias for Revert)

```bash
pnpm migration:rollback
```

Same as `migration:revert` - reverts the last migration.

### Revert Multiple Migrations

To revert multiple migrations, run the revert command multiple times:

```bash
pnpm migration:revert
pnpm migration:revert
pnpm migration:revert
```

---

## 📊 Check Migration Status

### Show Migration Status

```bash
pnpm migration:show
```

or

```bash
pnpm migration:status
```

Displays which migrations have been applied and which are pending.

---

## 🔄 Common Workflows

### Workflow 1: Create and Apply New Migration

```bash
# 1. Create entity or modify existing one
# 2. Generate migration
pnpm migration:generate src/migrations/AddUserRoleColumn

# 3. Review the generated SQL
# 4. Apply migration
pnpm migration:run

# 5. Check status
pnpm migration:show
```

### Workflow 2: Rollback and Fix Migration

```bash
# 1. If migration has an error, rollback
pnpm migration:rollback

# 2. Fix the migration file
# 3. Run again
pnpm migration:run
```

### Workflow 3: Reset All Migrations (Development Only)

```bash
# Revert all migrations one by one
pnpm migration:revert
pnpm migration:revert
pnpm migration:revert
# ... continue until all are reverted

# Or drop the database and start fresh
# Then run all migrations again
pnpm migration:run
```

---

## ⚠️ Important Notes

1. **Production Safety**: Always test migrations in development first
2. **Backup**: Always backup production database before running migrations
3. **Down Method**: Always implement the `down()` method for rollback capability
4. **Review SQL**: Always review generated SQL before applying migrations
5. **No Manual Changes**: Don't modify database schema manually - use migrations

---

## 📂 Migration File Structure

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1234567890 implements MigrationInterface {
  // Runs when applying migration (pnpm migration:run)
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "email" VARCHAR NOT NULL UNIQUE
            )
        `);
  }

  // Runs when reverting migration (pnpm migration:revert)
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

---

## 🎯 Quick Reference

| Command                   | Description                  |
| ------------------------- | ---------------------------- |
| `pnpm migration:create`   | Create empty migration       |
| `pnpm migration:generate` | Generate from entities       |
| `pnpm migration:run`      | Apply all pending migrations |
| `pnpm migration:revert`   | Undo last migration          |
| `pnpm migration:rollback` | Same as revert               |
| `pnpm migration:show`     | Show migration status        |
| `pnpm migration:status`   | Same as show                 |
