import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

export abstract class BaseSeeder {
  protected readonly logger: Logger;
  protected readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.logger = new Logger(this.constructor.name);
  }

  abstract run(): Promise<void>;

  protected async executeQuery(query: string, parameters?: unknown[]): Promise<void> {
    await this.dataSource.query(query, parameters);
  }

  protected getRepository<T>(entity: new () => T) {
    return this.dataSource.getRepository(entity);
  }
}
