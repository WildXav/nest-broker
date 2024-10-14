import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { AlertModel } from './models/alert.model';
import { ConfigService } from '@nestjs/config';
import { Cron, Timeout } from '@nestjs/schedule';
import { DatabaseService } from './database.service';

@Injectable()
export class AlertRetrieverService implements OnModuleDestroy {
  private readonly client: ImapFlow;
  private logger = new Logger(AlertRetrieverService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
  ) {
    this.client = new ImapFlow({
      host: this.configService.get<string>('IMAP_HOST'),
      port: this.configService.get<number>('IMAP_PORT'),
      secure: true,
      logger: false,
      auth: {
        user: this.configService.get<string>('IMAP_USER'),
        pass: this.configService.get<string>('IMAP_PASS'),
      },
    });
  }

  async imapConnect(): Promise<AlertRetrieverService> {
    this.logger.log('Connecting IMAP client');
    await this.client.connect();
    return this;
  }

  @Timeout(3000)
  @Cron('0,15,30 0,1 */1 * * *')
  async searchForAlerts() {
    this.logger.log('Searching for new Alerts');
    const lock = await this.client.getMailboxLock('INBOX');
    try {
      for await (const message of this.client.fetch(
        {
          subject: `Alert: ${this.configService.get<string>('ALERT_NAME')}`,
          since: new Date(this.db.data.lastProcessedBarTime),
        },
        {
          source: true,
        },
      )) {
        const content = (await simpleParser(message.source)).text;
        const match = content.match(/({"event":[\s\S]+})/);
        if (match.length < 2) return;
        try {
          const alert = new AlertModel(
            match[1],
            this.configService.get<string>('ALERT_SYMBOL'),
            this.configService.get<number>('ALERT_TIMEFRAME'),
          );
          this.logger.debug(JSON.stringify(alert));
        } catch (e) {
          this.logger.warn(`Parsing error: ${e}. Skipping`);
        }
      }
    } finally {
      lock.release();
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting IMAP client');
    await this.client.logout();
  }
}
