import { Inject, Injectable } from '@nestjs/common';
import {
  Channel,
  NotificationDeliveryStatus,
  ReminderDeliveryService,
  ReminderService,
} from '@libs/backend-config';
import { LoggerService } from '@libs/backend-common';
import {
  NOTIFICATION_CHANNEL_FACTORY_PORT,
  NOTIFICATION_QUEUE_PORT,
} from './notification.tokens';
import { NotificationQueuePort } from './queue/notification-queue.port';
import { NotificationConfigService } from './notification-config.service';
import { DispatchJobPayload } from './notification.types';
import { NotificationChannelFactoryPort } from './channels/notification-channel-factory.port';

@Injectable()
export class ReminderDispatchService {
  constructor(
    private readonly reminderService: ReminderService,
    private readonly reminderDeliveryService: ReminderDeliveryService,
    private readonly config: NotificationConfigService,
    private readonly logger: LoggerService,
    @Inject(NOTIFICATION_QUEUE_PORT)
    private readonly queue: NotificationQueuePort,
    @Inject(NOTIFICATION_CHANNEL_FACTORY_PORT)
    private readonly channelFactory: NotificationChannelFactoryPort,
  ) {}

  async enqueueDueReminders(now: Date = new Date()): Promise<number> {
    const dueReminders = await this.reminderService.findDueForDispatch(now);
    let queuedCount = 0;

    for (const reminder of dueReminders) {
      const requestedChannel = reminder.channel ?? Channel.IN_APP;
      const resolvedChannel = this.config.resolveChannel(requestedChannel);
      const payload = {
        reminderId: reminder.id,
        message: reminder.message,
        targetId: reminder.targetId,
        requestedChannel,
        resolvedChannel,
      };

      const delivery = await this.reminderDeliveryService.createOrQueueDelivery(
        reminder.id,
        resolvedChannel,
        payload,
        this.config.maxAttempts,
      );

      if (
        delivery.status === NotificationDeliveryStatus.SENT ||
        delivery.status === NotificationDeliveryStatus.PROCESSING
      ) {
        continue;
      }

      const jobPayload: DispatchJobPayload = {
        deliveryId: delivery.id,
        reminderId: reminder.id,
        channel: resolvedChannel,
        requestedChannel,
      };

      const jobId = await this.queue.enqueueDispatch(jobPayload, {
        retryLimit: Math.max(0, delivery.maxAttempts - 1),
        retryDelaySeconds: 30,
        retryBackoff: this.config.retryBackoff,
      });

      if (jobId) {
        await this.reminderDeliveryService.updateJobId(delivery.id, jobId);
      }
      queuedCount += 1;
    }

    return queuedCount;
  }

  async processDispatchJob(job: DispatchJobPayload): Promise<void> {
    const delivery = await this.reminderDeliveryService.markProcessing(job.deliveryId);
    const reminder = await this.reminderService.findById(job.reminderId);
    const channelService = this.channelFactory.get(job.channel);

    try {
      const result = await channelService.send({
        reminder,
        delivery,
      });

      await this.reminderDeliveryService.markSent(delivery.id, result.providerMessageId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido al enviar notificacion';

      if (delivery.attempts >= delivery.maxAttempts) {
        await this.reminderDeliveryService.markDeadLetter(delivery.id, errorMessage);
        await this.queue.enqueueDeadLetter(job, errorMessage);
        this.logger.error(
          `Delivery ${delivery.id} moved to dead letter after ${delivery.attempts} attempts`,
          undefined,
          { module: 'ReminderDispatchService', reminderId: reminder.id },
        );
        return;
      }

      await this.reminderDeliveryService.markFailed(delivery.id, errorMessage);
      throw error;
    }
  }
}
