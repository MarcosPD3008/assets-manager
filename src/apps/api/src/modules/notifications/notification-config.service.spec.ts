import { ConfigService } from '@nestjs/config';
import { Channel } from '@libs/backend-config';
import { NotificationConfigService } from './notification-config.service';

describe('NotificationConfigService', () => {
  it('should parse active channels from env', () => {
    const service = new NotificationConfigService(
      new ConfigService({
        NOTIFICATION_ACTIVE_CHANNELS: 'IN_APP,PUSH,WHATSAPP',
      }),
    );

    expect(service.activeChannels).toEqual([
      Channel.IN_APP,
      Channel.PUSH,
      Channel.WHATSAPP,
    ]);
  });

  it('should fallback to IN_APP when channel is inactive', () => {
    const service = new NotificationConfigService(
      new ConfigService({
        NOTIFICATION_ACTIVE_CHANNELS: 'IN_APP',
      }),
    );

    expect(service.resolveChannel(Channel.EMAIL)).toBe(Channel.IN_APP);
  });
});
