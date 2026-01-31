import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const config: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  synchronize: false, // Disabled - use migrations instead for schema changes
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DATABASE_URL?.includes('sslmode=require') ||
    process.env.DATABASE_URL?.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : false,
  extra: {
    max: 10,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    query_timeout: 30000,
  },
};

// Export config for NestJS
export const typeOrmConfig = config;

// Export DataSource for TypeORM CLI (must be default export)
const AppDataSource = new DataSource(config);
export default AppDataSource;
