import { DataSource } from 'typeorm';
import { BaseSeeder } from './base-seeder';
import { RoleSeeder } from './role.seeder';

export class Seeder {
  private readonly dataSource: DataSource;
  private readonly seeders: BaseSeeder[];

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.seeders = [new RoleSeeder(dataSource)];
  }

  async run(): Promise<void> {
    console.log('🌱 Starting database seeding...\n');

    try {
      // Run seeders in order
      for (const seeder of this.seeders) {
        await seeder.run();
        console.log('');
      }

      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  async runSpecific(seederName: string): Promise<void> {
    const seeder = this.seeders.find(
      (s) => s.constructor.name.toLowerCase() === seederName.toLowerCase(),
    );

    if (!seeder) {
      throw new Error(`Seeder "${seederName}" not found`);
    }

    console.log(`🌱 Running seeder: ${seederName}...\n`);
    await seeder.run();
    console.log(`✅ Seeder "${seederName}" completed!`);
  }
}
