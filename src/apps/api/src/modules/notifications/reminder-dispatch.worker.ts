import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@libs/backend-common';
import { NOTIFICATION_QUEUE_PORT } from './notification.tokens';
import { NotificationQueuePort } from './queue/notification-queue.port';
import { ReminderDispatchService } from './reminder-dispatch.service';
import { NotificationConfigService } from './notification-config.service';

@Injectable()
export class ReminderDispatchWorker implements OnModuleInit {
  constructor(
    private readonly config: NotificationConfigService,
    private readonly logger: LoggerService,
    private readonly reminderDispatchService: ReminderDispatchService,
    @Inject(NOTIFICATION_QUEUE_PORT)
    private readonly queue: NotificationQueuePort,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.workerEnabled) {
      return;
    }

    await this.queue.registerDispatchWorker(async (payload) => {
      await this.reminderDispatchService.processDispatchJob(payload);
    });

    this.logger.log('Notification dispatch worker enabled.', {
      module: 'ReminderDispatchWorker',
    });
  }
}
