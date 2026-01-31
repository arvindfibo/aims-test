# Database Seeders

This directory contains database seeders for populating your database with initial data.

## Structure

- `base-seeder.ts` - Base class for all seeders
- `role.seeder.ts` - Seeds default roles
- `user.seeder.ts` - Seeds default users
- `company-group.seeder.ts` - Seeds default company groups
- `index.ts` - Main seeder runner

## Usage

### Run All Seeders

```bash
pnpm seed
```

This will run all seeders in the correct order:

1. RoleSeeder - Creates default roles
2. UserSeeder - Creates default users
3. CompanyGroupSeeder - Creates default company groups

### Run Specific Seeder

```bash
# Seed only roles
pnpm seed:role

# Seed only users
pnpm seed:user

# Seed only company groups
pnpm seed:company-group
```

## Default Data

### Users

- **admin@aims-erp.com** / `Admin@123`
  - Super Admin user
  - Verified and active

- **demo@aims-erp.com** / `Admin@123`
  - Demo user
  - Verified and active

### Roles

- **super_admin** - Full system access
- **company_admin** - Company-level administration
- **division_admin** - Division-level administration
- **department_admin** - Department-level administration
- **employee** - Basic employee access

### Company Groups

- **AIMS ERP Demo Group** (code: `AIMS_DEMO`)
  - Demo company group
  - Linked to super admin

## Creating New Seeders

1. Create a new file: `src/seeders/your-entity.seeder.ts`

2. Extend `BaseSeeder`:

```typescript
import { DataSource } from 'typeorm';
import { BaseSeeder } from './base-seeder';

export class YourEntitySeeder extends BaseSeeder {
  async run(): Promise<void> {
    this.logger.log('Seeding your entities...');

    // Your seeding logic here
    const entities = [{ name: 'Entity 1' }, { name: 'Entity 2' }];

    for (const entity of entities) {
      const existing = await this.dataSource.query(`SELECT id FROM your_table WHERE name = $1`, [
        entity.name,
      ]);

      if (existing.length === 0) {
        await this.dataSource.query(
          `INSERT INTO your_table (name, created_at, updated_at) 
           VALUES ($1, NOW(), NOW())`,
          [entity.name],
        );
        this.logger.log(`✓ Created: ${entity.name}`);
      } else {
        this.logger.log(`- Already exists: ${entity.name}`);
      }
    }

    this.logger.log('Your entities seeding completed!');
  }
}
```

3. Register in `src/seeders/index.ts`:

```typescript
import { YourEntitySeeder } from './your-entity.seeder';

// In the constructor:
this.seeders = [
  // ... existing seeders
  new YourEntitySeeder(dataSource),
];
```

4. Add script to `package.json` (optional):

```json
"seed:your-entity": "ts-node -r tsconfig-paths/register scripts/seed.ts YourEntitySeeder"
```

## Best Practices

1. **Idempotent**: Seeders should be safe to run multiple times
2. **Check for existing data**: Always check if data exists before inserting
3. **Use transactions**: For complex seeders, consider using transactions
4. **Order matters**: Seeders run in the order they're registered
5. **Logging**: Use `this.logger` for consistent logging
6. **Environment aware**: Consider different data for dev/staging/production

## Notes

- Seeders use raw SQL queries for flexibility
- All seeders check for existing data to prevent duplicates
- Default password for seeded users: `Admin@123`
- Change default passwords in production!
