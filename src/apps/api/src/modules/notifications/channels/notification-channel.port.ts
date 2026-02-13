import { Channel } from '@libs/backend-config';
import {
  NotificationSendInput,
  NotificationSendResult,
} from '../notification.types';

export interface NotificationChannelPort {
  readonly channel: Channel;
  send(input: NotificationSendInput): Promise<NotificationSendResult>;
}
