import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AlertRetrieverService } from './alert-retriever.service';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbDataModel, DefaultDbData } from './models/db-data.model';
import { DatabaseService } from './database.service';
import { JSONFilePreset } from 'lowdb/node';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ConfigModule.forRoot(), ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'DB_SERVICE',
      useFactory: async () => {
        const db = await JSONFilePreset<DbDataModel>('db.json', DefaultDbData);
        await db.read();
        return new DatabaseService(db);
      },
    },
    {
      provide: 'ALERT_RETRIEVER_SERVICE',
      inject: [ConfigService, 'DB_SERVICE'],
      useFactory: async (
        configService: ConfigService,
        dbService: DatabaseService,
      ) => {
        return new AlertRetrieverService(
          configService,
          dbService,
        ).imapConnect();
      },
    },
  ],
})
export class AppModule {}
