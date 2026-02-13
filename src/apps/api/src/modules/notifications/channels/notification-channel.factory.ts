import { Injectable } from '@nestjs/common';
import { Channel } from '@libs/backend-config';
import { LoggerService } from '@libs/backend-common';
import { NotificationConfigService } from '../notification-config.service';
import { NotificationChannelFactoryPort } from './notification-channel-factory.port';
import { NotificationChannelPort } from './notification-channel.port';
import { InAppNotificationService } from './in-app-notification.service';
import { PushNotificationService } from './push-notification.service';
import { WhatsappNotificationService } from './whatsapp-notification.service';
import { EmailNotificationService } from './email-notification.service';
import { SmsNotificationService } from './sms-notification.service';

@Injectable()
export class NotificationChannelFactory implements NotificationChannelFactoryPort {
  constructor(
    private readonly config: NotificationConfigService,
    private readonly logger: LoggerService,
    private readonly inAppNotificationService: InAppNotificationService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly whatsappNotificationService: WhatsappNotificationService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly smsNotificationService: SmsNotificationService,
  ) {}

  get(channel: Channel): NotificationChannelPort {
    const resolvedChannel = this.config.resolveChannel(channel);
    if (resolvedChannel !== channel) {
      this.logger.warn(
        `Canal ${channel} no activo. Se usara fallback ${resolvedChannel}.`,
        { module: 'NotificationChannelFactory' },
      );
    }

    switch (resolvedChannel) {
      case Channel.IN_APP:
        return this.inAppNotificationService;
      case Channel.PUSH:
        return this.pushNotificationService;
      case Channel.WHATSAPP:
        return this.whatsappNotificationService;
      case Channel.EMAIL:
        return this.emailNotificationService;
      case Channel.SMS:
        return this.smsNotificationService;
      default:
        return this.inAppNotificationService;
    }
  }
}
