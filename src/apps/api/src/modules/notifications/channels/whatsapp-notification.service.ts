import { Injectable, NotImplementedException } from '@nestjs/common';
import { Channel } from '@libs/backend-config';
import { NotificationChannelPort } from './notification-channel.port';
import {
  NotificationSendInput,
  NotificationSendResult,
} from '../notification.types';

@Injectable()
export class WhatsappNotificationService implements NotificationChannelPort {
  readonly channel = Channel.WHATSAPP;

  async send(_input: NotificationSendInput): Promise<NotificationSendResult> {
    throw new NotImplementedException(
      'Canal WHATSAPP no implementado en esta fase.',
    );
  }
}
