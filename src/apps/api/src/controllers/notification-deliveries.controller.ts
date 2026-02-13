import { Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Channel,
  NotificationDeliveryStatus,
  ReminderDelivery,
  ReminderDeliveryService,
  ReminderService,
} from '@libs/backend-config';
import { NOTIFICATION_QUEUE_PORT } from '../modules/notifications/notification.tokens';
import { NotificationQueuePort } from '../modules/notifications/queue/notification-queue.port';
import { NotificationConfigService } from '../modules/notifications/notification-config.service';

@ApiTags('Notification Deliveries')
@Controller('notification-deliveries')
export class NotificationDeliveriesController {
  constructor(
    private readonly reminderDeliveryService: ReminderDeliveryService,
    private readonly reminderService: ReminderService,
    private readonly notificationConfigService: NotificationConfigService,
    @Inject(NOTIFICATION_QUEUE_PORT)
    private readonly queue: NotificationQueuePort,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get notification deliveries',
    description:
      'Retrieve paginated deliveries with optional filters by status, channel and reminderId.',
  })
  async findAll(
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
    @Query('status') status?: NotificationDeliveryStatus,
    @Query('channel') channel?: Channel,
    @Query('reminderId') reminderId?: string,
  ): Promise<{ items: ReminderDelivery[]; total: number }> {
    const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1);
    const pageSize = Math.max(1, parseInt(pageSizeRaw ?? '10', 10) || 10);

    const where: Record<string, any> = {};
    if (status) {
      where.status = status;
    }
    if (channel) {
      where.channel = channel;
    }
    if (reminderId) {
      where.reminderId = reminderId;
    }

    return await this.reminderDeliveryService.findAllPaginated({
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { queuedAt: 'DESC' },
      relations: ['reminder'],
      page,
      pageSize,
    });
  }

  @Post(':id/requeue')
  @ApiOperation({
    summary: 'Requeue a failed/dead-letter delivery',
    description: 'Requeue one delivery and enqueue dispatch job again.',
  })
  async requeue(@Param('id') id: string): Promise<ReminderDelivery> {
    const delivery = await this.reminderDeliveryService.requeue(
      id,
      this.notificationConfigService.maxAttempts,
    );
    const reminder = await this.reminderService.findById(delivery.reminderId);

    const jobId = await this.queue.enqueueDispatch(
      {
        deliveryId: delivery.id,
        reminderId: delivery.reminderId,
        channel: delivery.channel,
        requestedChannel: reminder.channel ?? delivery.channel,
      },
      {
        retryLimit: Math.max(0, delivery.maxAttempts - 1),
        retryBackoff: this.notificationConfigService.retryBackoff,
        retryDelaySeconds: 30,
      },
    );

    if (jobId) {
      await this.reminderDeliveryService.updateJobId(delivery.id, jobId);
    }

    return await this.reminderDeliveryService.findById(delivery.id, ['reminder']);
  }
}
