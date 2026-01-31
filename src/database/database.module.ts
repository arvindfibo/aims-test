import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/database.config';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig)],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(private dataSource: DataSource) {}

  onModuleInit() {
    if (this.dataSource.isInitialized) {
      console.log('✅ Database connected successfully!');
      this.logger.log('✅ Database connected successfully!');
      const dbName = this.dataSource.options.database;
      this.logger.log(`Database: ${dbName ? String(dbName) : 'Connected'}`);
    } else {
      console.error('❌ Database connection failed!');
      this.logger.error('❌ Database connection failed!');
    }
  }
}
