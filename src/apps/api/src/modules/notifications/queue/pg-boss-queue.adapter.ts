import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@libs/backend-common';
import { NotificationConfigService } from '../notification-config.service';
import { NotificationQueuePort } from './notification-queue.port';
import {
  DispatchHandler,
  DispatchJobPayload,
  QueueJobOptions,
} from '../notification.types';

const PgBossLib = require('pg-boss');
const PgBossCtor = PgBossLib.PgBoss || PgBossLib.default || PgBossLib;

@Injectable()
export class PgBossQueueAdapter
  implements NotificationQueuePort, OnModuleInit, OnModuleDestroy
{
  private boss?: any;
  private workerRegistered = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationConfigService: NotificationConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.notificationConfigService.queueDriver !== 'pgboss') {
      this.logger.log('Notification queue driver set to non-pgboss. Adapter disabled.', {
        module: 'PgBossQueueAdapter',
      });
      return;
    }

    const connectionString = this.buildConnectionString();
    this.boss = new PgBossCtor({
      connectionString,
      application_name: 'assets-manager-notifications',
      deleteAfterDays: 14,
    });

    await this.boss.start();
    await this.boss.createQueue(this.notificationConfigService.dispatchQueueName);
    await this.boss.createQueue(this.notificationConfigService.deadLetterQueueName);

    this.logger.log('pg-boss initialized for notifications.', {
      module: 'PgBossQueueAdapter',
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async enqueueDispatch(
    job: DispatchJobPayload,
    opts?: QueueJobOptions,
  ): Promise<string | undefined> {
    if (!this.boss) {
      return undefined;
    }

    const jobId = await this.boss.send(
      this.notificationConfigService.dispatchQueueName,
      job,
      {
        retryLimit:
          opts?.retryLimit ??
          Math.max(0, this.notificationConfigService.maxAttempts - 1),
        retryDelay: opts?.retryDelaySeconds ?? 30,
        retryBackoff:
          opts?.retryBackoff ?? this.notificationConfigService.retryBackoff,
      },
    );

    return typeof jobId === 'string' ? jobId : undefined;
  }

  async enqueueDeadLetter(
    job: DispatchJobPayload,
    reason: string,
  ): Promise<string | undefined> {
    if (!this.boss) {
      return undefined;
    }

    const jobId = await this.boss.send(
      this.notificationConfigService.deadLetterQueueName,
      { ...job, reason },
      { retryLimit: 0 },
    );

    return typeof jobId === 'string' ? jobId : undefined;
  }

  async registerDispatchWorker(handler: DispatchHandler): Promise<void> {
    if (!this.boss || this.workerRegistered) {
      return;
    }

    await this.boss.work(
      this.notificationConfigService.dispatchQueueName,
      async (job) => {
        if (!job?.data) {
          return;
        }
        await handler({
          ...(job.data as DispatchJobPayload),
          jobId: job.id,
        });
      },
    );

    this.workerRegistered = true;
    this.logger.log('Dispatch worker registered.', {
      module: 'PgBossQueueAdapter',
    });
  }

  async close(): Promise<void> {
    if (!this.boss) {
      return;
    }

    await this.boss.stop();
    this.boss = undefined;
    this.workerRegistered = false;
  }

  private buildConnectionString(): string {
    const host = this.configService.get<string>('DB_HOST') ?? 'localhost';
    const port = this.configService.get<string>('DB_PORT') ?? '5432';
    const username = this.configService.get<string>('DB_USERNAME') ?? 'postgres';
    const password = this.configService.get<string>('DB_PASSWORD') ?? 'password';
    const database = this.configService.get<string>('DB_DATABASE') ?? 'nest_monorepo';
    return `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
}
