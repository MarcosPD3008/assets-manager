import { Channel } from '@libs/backend-config';
import { NotificationChannelPort } from './notification-channel.port';

export interface NotificationChannelFactoryPort {
  get(channel: Channel): NotificationChannelPort;
}
