import { Injectable } from '@nestjs/common';
import { Channel } from '@libs/backend-config';
import { LoggerService } from '@libs/backend-common';
import { NotificationChannelPort } from './notification-channel.port';
import {
  NotificationSendInput,
  NotificationSendResult,
} from '../notification.types';

@Injectable()
export class InAppNotificationService implements NotificationChannelPort {
  readonly channel = Channel.IN_APP;

  constructor(private readonly logger: LoggerService) {}

  async send(input: NotificationSendInput): Promise<NotificationSendResult> {
    this.logger.log(
      `In-app reminder dispatched: ${input.reminder.id}`,
      { module: 'InAppNotificationService', reminderId: input.reminder.id },
    );

    return {
      providerMessageId: `in-app-${input.reminder.id}-${Date.now()}`,
      metadata: {
        targetId: input.reminder.targetId,
      },
    };
  }
}
