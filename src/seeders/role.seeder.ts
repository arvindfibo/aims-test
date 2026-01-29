import { BaseSeeder } from './base-seeder';

interface RoleQueryResult {
  id: number;
}

export class RoleSeeder extends BaseSeeder {
  async run(): Promise<void> {
    this.logger.log('Seeding roles...');

    const roles = [
      {
        name: 'GROUP_ADMIN',
        permissions: {
          company_groups: ['create', 'read', 'update', 'delete'],
          companies: ['create', 'read', 'update', 'delete'],
          divisions: ['create', 'read', 'update', 'delete'],
          departments: ['create', 'read', 'update', 'delete'],
          users: ['create', 'read', 'update', 'delete'],
          roles: ['read'],
          tenders: ['read'],
          projects: ['read'],
        },
      },
      {
        name: 'COMPANY_ADMIN',
        permissions: {
          companies: ['read', 'update'],
          divisions: ['create', 'read', 'update', 'delete'],
          departments: ['create', 'read', 'update', 'delete'],
          users: ['create', 'read', 'update'],
          tenders: ['create', 'read', 'update', 'delete'],
          projects: ['create', 'read', 'update', 'delete'],
        },
      },
      {
        name: 'COMPANY_USER',
        permissions: {
          companies: ['read'],
          divisions: ['read'],
          departments: ['read'],
          users: ['read'],
          tenders: ['read'],
          projects: ['read'],
          profile: ['read', 'update'],
        },
      },
      {
        name: 'DIVISION_ADMIN',
        permissions: {
          divisions: ['read', 'update'],
          departments: ['create', 'read', 'update', 'delete'],
          users: ['read', 'update'],
          tenders: ['create', 'read', 'update', 'delete'],
          projects: ['create', 'read', 'update', 'delete'],
        },
      },
      {
        name: 'DIVISION_USER',
        permissions: {
          divisions: ['read'],
          departments: ['read'],
          users: ['read'],
          tenders: ['read'],
          projects: ['read'],
          profile: ['read', 'update'],
        },
      },
      {
        name: 'DEPARTMENT_ADMIN',
        permissions: {
          departments: ['read', 'update'],
          users: ['read', 'update'],
          tenders: ['create', 'read', 'update', 'delete'],
          projects: ['create', 'read', 'update', 'delete'],
        },
      },
      {
        name: 'DEPARTMENT_USER',
        permissions: {
          departments: ['read'],
          users: ['read'],
          tenders: ['read'],
          projects: ['read'],
          profile: ['read', 'update'],
        },
      },
      {
        name: 'TENDER_ADMIN',
        permissions: {
          tenders: ['create', 'read', 'update', 'delete'],
          projects: ['read'],
          users: ['read'],
          profile: ['read', 'update'],
        },
      },
      {
        name: 'TENDER_USER',
        permissions: {
          tenders: ['read'],
          projects: ['read'],
          users: ['read'],
          profile: ['read', 'update'],
        },
      },
      {
        name: 'PROJECT_ADMIN',
        permissions: {
          projects: ['create', 'read', 'update', 'delete'],
          tenders: ['read'],
          users: ['read'],
          profile: ['read', 'update'],
        },
      },
      {
        name: 'PROJECT_USER',
        permissions: {
          projects: ['read'],
          tenders: ['read'],
          users: ['read'],
          profile: ['read', 'update'],
        },
      },
    ];

    for (const role of roles) {
      const existingRole = await this.dataSource.query<RoleQueryResult[]>(
        `SELECT id FROM roles WHERE name = $1`,
        [role.name],
      );

      if (existingRole.length === 0) {
        await this.dataSource.query(
          `INSERT INTO roles (name, permissions, created_at, updated_at) 
           VALUES ($1, $2, NOW(), NOW())`,
          [role.name, JSON.stringify(role.permissions)],
        );
        this.logger.log(`✓ Created role: ${role.name}`);
      } else {
        this.logger.log(`- Role already exists: ${role.name}`);
      }
    }

    this.logger.log('Roles seeding completed!');
  }
}
