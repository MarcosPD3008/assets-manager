import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LoggerService } from '@libs/backend-common';
import { NotificationConfigService } from './notification-config.service';
import { ReminderDispatchService } from './reminder-dispatch.service';

@Injectable()
export class ReminderDispatchScheduler {
  private inProgress = false;

  constructor(
    private readonly config: NotificationConfigService,
    private readonly reminderDispatchService: ReminderDispatchService,
    private readonly logger: LoggerService,
  ) {}

  @Cron(process.env['NOTIFICATION_CRON_EXPRESSION'] || '*/5 * * * *')
  async handleCron(): Promise<void> {
    if (!this.config.cronEnabled || this.inProgress) {
      return;
    }

    this.inProgress = true;
    try {
      const queued = await this.reminderDispatchService.enqueueDueReminders();
      if (queued > 0) {
        this.logger.log(`Se encolaron ${queued} notificaciones.`, {
          module: 'ReminderDispatchScheduler',
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido en scheduler';
      this.logger.error(message, undefined, {
        module: 'ReminderDispatchScheduler',
      });
    } finally {
      this.inProgress = false;
    }
  }
}
