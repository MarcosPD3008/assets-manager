import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reminder, ReminderDelivery } from '@libs/backend-config';
import {
  NOTIFICATION_CHANNEL_FACTORY_PORT,
  NOTIFICATION_QUEUE_PORT,
} from './notification.tokens';
import { NotificationConfigService } from './notification-config.service';
import { ReminderDispatchService } from './reminder-dispatch.service';
import { ReminderDispatchScheduler } from './reminder-dispatch.scheduler';
import { ReminderDispatchWorker } from './reminder-dispatch.worker';
import { PgBossQueueAdapter } from './queue/pg-boss-queue.adapter';
import { NotificationChannelFactory } from './channels/notification-channel.factory';
import { InAppNotificationService } from './channels/in-app-notification.service';
import { PushNotificationService } from './channels/push-notification.service';
import { WhatsappNotificationService } from './channels/whatsapp-notification.service';
import { EmailNotificationService } from './channels/email-notification.service';
import { SmsNotificationService } from './channels/sms-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reminder, ReminderDelivery])],
  providers: [
    NotificationConfigService,
    ReminderDispatchService,
    ReminderDispatchScheduler,
    ReminderDispatchWorker,
    PgBossQueueAdapter,
    NotificationChannelFactory,
    InAppNotificationService,
    PushNotificationService,
    WhatsappNotificationService,
    EmailNotificationService,
    SmsNotificationService,
    {
      provide: NOTIFICATION_QUEUE_PORT,
      useExisting: PgBossQueueAdapter,
    },
    {
      provide: NOTIFICATION_CHANNEL_FACTORY_PORT,
      useExisting: NotificationChannelFactory,
    },
  ],
  exports: [
    NotificationConfigService,
    ReminderDispatchService,
    NOTIFICATION_QUEUE_PORT,
    NOTIFICATION_CHANNEL_FACTORY_PORT,
  ],
})
export class NotificationsModule {}
