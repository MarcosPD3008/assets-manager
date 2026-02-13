import { Injectable, NotImplementedException } from '@nestjs/common';
import { Channel } from '@libs/backend-config';
import { NotificationChannelPort } from './notification-channel.port';
import {
  NotificationSendInput,
  NotificationSendResult,
} from '../notification.types';

@Injectable()
export class SmsNotificationService implements NotificationChannelPort {
  readonly channel = Channel.SMS;

  async send(_input: NotificationSendInput): Promise<NotificationSendResult> {
    throw new NotImplementedException(
      'Canal SMS no implementado en esta fase.',
    );
  }
}
