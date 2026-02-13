import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel } from '@libs/backend-config';

@Injectable()
export class NotificationConfigService {
  constructor(private readonly configService: ConfigService) {}

  get queueDriver(): string {
    return this.configService.get<string>('NOTIFICATION_QUEUE_DRIVER') ?? 'pgboss';
  }

  get cronEnabled(): boolean {
    return this.parseBool(
      this.configService.get<string>('NOTIFICATION_CRON_ENABLED'),
      true,
    );
  }

  get cronExpression(): string {
    return (
      this.configService.get<string>('NOTIFICATION_CRON_EXPRESSION') ??
      '*/5 * * * *'
    );
  }

  get workerEnabled(): boolean {
    return this.parseBool(
      this.configService.get<string>('NOTIFICATION_WORKER_ENABLED'),
      true,
    );
  }

  get maxAttempts(): number {
    const value = parseInt(
      this.configService.get<string>('NOTIFICATION_MAX_ATTEMPTS') ?? '5',
      10,
    );
    return Number.isFinite(value) && value > 0 ? value : 5;
  }

  get retryBackoff(): boolean {
    return this.parseBool(
      this.configService.get<string>('NOTIFICATION_RETRY_BACKOFF'),
      true,
    );
  }

  get deadLetterQueueName(): string {
    return (
      this.configService.get<string>('NOTIFICATION_DLQ_NAME') ??
      'notifications.dead-letter'
    );
  }

  get dispatchQueueName(): string {
    return 'notifications.dispatch';
  }

  get activeChannels(): Channel[] {
    const raw = this.configService.get<string>('NOTIFICATION_ACTIVE_CHANNELS');
    if (!raw) {
      return [Channel.IN_APP];
    }

    const channels = raw
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
      .filter((item) => Object.values(Channel).includes(item as Channel)) as Channel[];

    return channels.length > 0 ? channels : [Channel.IN_APP];
  }

  isChannelActive(channel: Channel): boolean {
    return this.activeChannels.includes(channel);
  }

  resolveChannel(channel: Channel): Channel {
    if (this.isChannelActive(channel)) {
      return channel;
    }
    return Channel.IN_APP;
  }

  private parseBool(value: string | undefined, fallback: boolean): boolean {
    if (value === undefined) {
      return fallback;
    }
    return value.toLowerCase() === 'true';
  }
}
