import 'reflect-metadata';
import { DataSource } from 'typeorm';
import 'dotenv/config';
import { Seeder } from '../src/seeders/index';

async function bootstrap() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../src/**/*.entity.{ts,js}'],
    migrations: [__dirname + '/../src/migrations/*.{ts,js}'],
    synchronize: false,
    logging: false,
    ssl:
      process.env.DATABASE_URL?.includes('sslmode=require') ||
      process.env.DATABASE_URL?.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully!\n');

    const seeder = new Seeder(dataSource);

    // Check if specific seeder is requested
    const seederName = process.argv[2];

    if (seederName) {
      await seeder.runSpecific(seederName);
    } else {
      await seeder.run();
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

void bootstrap();
