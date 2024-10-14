import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DbDataModel } from './models/db-data.model';
import { Low } from 'lowdb';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private logger = new Logger(DatabaseService.name);

  constructor(private readonly db: Low<DbDataModel>) {}

  get data() {
    return this.db.data;
  }

  async onModuleDestroy() {
    this.logger.log('Writing any remaining changes to Database');
    await this.db.write();
  }
}
