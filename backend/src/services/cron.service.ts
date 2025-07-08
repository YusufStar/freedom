import { CronJob } from 'cron';
import { config } from '../config/config';
import { MailSyncService } from './mail-sync.service';
import { AuthService } from './auth.service';

export class CronService {
  private mailSyncJob: CronJob | null = null;
  private tokenCleanupJob: CronJob | null = null;
  private mailSyncService: MailSyncService;
  private authService: AuthService;

  constructor() {
    this.mailSyncService = new MailSyncService();
    this.authService = new AuthService();
  }

  start() {
    // Mail sync job - runs every 30 seconds
    const cronPattern = `*/${config.sync.intervalSeconds} * * * * *`;
    
    this.mailSyncJob = new CronJob(
      cronPattern,
      async () => {
        try {
          console.log('Starting mail sync...');
          await this.mailSyncService.syncAllAccounts();
          console.log('Mail sync completed');
        } catch (error) {
          console.error('Mail sync failed:', error);
        }
      },
      null,
      true,
      'UTC'
    );

    // Token cleanup job - runs every hour
    this.tokenCleanupJob = new CronJob(
      '0 0 * * * *',
      async () => {
        try {
          await this.authService.cleanExpiredTokens();
          console.log('Expired tokens cleaned');
        } catch (error) {
          console.error('Token cleanup failed:', error);
        }
      },
      null,
      true,
      'UTC'
    );

    console.log(`Cron jobs started - Mail sync every ${config.sync.intervalSeconds} seconds`);
  }

  stop() {
    if (this.mailSyncJob) {
      this.mailSyncJob.stop();
      this.mailSyncJob = null;
    }

    if (this.tokenCleanupJob) {
      this.tokenCleanupJob.stop();
      this.tokenCleanupJob = null;
    }

    console.log('Cron jobs stopped');
  }

  // Manual trigger for sync
  async triggerSync(): Promise<void> {
    await this.mailSyncService.syncAllAccounts();
  }
} 