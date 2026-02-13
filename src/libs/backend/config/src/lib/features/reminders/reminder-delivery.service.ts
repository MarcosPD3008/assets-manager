import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BaseService } from '../../users/services/base.service';
import { ReminderDelivery } from './reminder-delivery.entity';
import { Channel, NotificationDeliveryStatus, ReminderStatus } from '../shared/enums';
import { Reminder } from './reminder.entity';

@Injectable()
export class ReminderDeliveryService extends BaseService<ReminderDelivery> {
  constructor(
    @InjectRepository(ReminderDelivery)
    private readonly reminderDeliveryRepository: Repository<ReminderDelivery>,
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
  ) {
    super(reminderDeliveryRepository);
  }

  async findByReminderAndChannel(
    reminderId: string,
    channel: Channel,
  ): Promise<ReminderDelivery | null> {
    return await this.reminderDeliveryRepository.findOne({
      where: { reminderId, channel },
    });
  }

  async createOrQueueDelivery(
    reminderId: string,
    channel: Channel,
    payload: Record<string, unknown>,
    maxAttempts: number,
  ): Promise<ReminderDelivery> {
    const idempotencyKey = this.buildIdempotencyKey(reminderId, channel);
    const existing = await this.reminderDeliveryRepository.findOne({
      where: { idempotencyKey },
    });

    if (existing) {
      if (
        existing.status === NotificationDeliveryStatus.SENT ||
        existing.status === NotificationDeliveryStatus.PROCESSING
      ) {
        return existing;
      }

      existing.status = NotificationDeliveryStatus.QUEUED;
      existing.lastError = undefined;
      existing.deadLetterAt = undefined;
      existing.queuedAt = new Date();
      existing.payload = payload;
      existing.maxAttempts = maxAttempts;
      return await this.reminderDeliveryRepository.save(existing);
    }

    const delivery = this.reminderDeliveryRepository.create({
      reminderId,
      channel,
      status: NotificationDeliveryStatus.QUEUED,
      attempts: 0,
      maxAttempts,
      idempotencyKey,
      queuedAt: new Date(),
      payload,
    });

    try {
      return await this.reminderDeliveryRepository.save(delivery);
    } catch (error: any) {
      if (error?.code === '23505') {
        const concurrent = await this.reminderDeliveryRepository.findOne({
          where: { idempotencyKey },
        });
        if (concurrent) {
          return concurrent;
        }
      }
      throw error;
    }
  }

  async markProcessing(deliveryId: string): Promise<ReminderDelivery> {
    const delivery = await this.findById(deliveryId);
    delivery.status = NotificationDeliveryStatus.PROCESSING;
    delivery.processedAt = new Date();
    delivery.attempts += 1;
    return await this.reminderDeliveryRepository.save(delivery);
  }

  async markSent(
    deliveryId: string,
    providerMessageId?: string,
  ): Promise<ReminderDelivery> {
    const delivery = await this.findById(deliveryId);
    delivery.status = NotificationDeliveryStatus.SENT;
    delivery.sentAt = new Date();
    delivery.lastError = undefined;
    if (providerMessageId) {
      delivery.providerMessageId = providerMessageId;
    }

    const saved = await this.reminderDeliveryRepository.save(delivery);
    await this.reminderRepository.update(delivery.reminderId, {
      status: ReminderStatus.SENT,
    });
    return saved;
  }

  async markFailed(
    deliveryId: string,
    message: string,
  ): Promise<ReminderDelivery> {
    const delivery = await this.findById(deliveryId);
    delivery.status = NotificationDeliveryStatus.FAILED;
    delivery.lastError = message;
    return await this.reminderDeliveryRepository.save(delivery);
  }

  async markDeadLetter(
    deliveryId: string,
    message: string,
  ): Promise<ReminderDelivery> {
    const delivery = await this.findById(deliveryId);
    delivery.status = NotificationDeliveryStatus.DEAD_LETTER;
    delivery.deadLetterAt = new Date();
    delivery.lastError = message;

    const saved = await this.reminderDeliveryRepository.save(delivery);
    await this.reminderRepository.update(delivery.reminderId, {
      status: ReminderStatus.OVERDUE,
    });
    return saved;
  }

  async updateJobId(deliveryId: string, jobId: string): Promise<void> {
    await this.reminderDeliveryRepository.update(deliveryId, { jobId });
  }

  async markAsSentByReminder(reminderId: string): Promise<void> {
    const active = await this.reminderDeliveryRepository.find({
      where: { reminderId },
    });

    if (active.length === 0) {
      return;
    }

    const now = new Date();
    for (const delivery of active) {
      if (delivery.status === NotificationDeliveryStatus.SENT) {
        continue;
      }
      delivery.status = NotificationDeliveryStatus.SENT;
      delivery.sentAt = now;
      delivery.lastError = undefined;
      await this.reminderDeliveryRepository.save(delivery);
    }
  }

  async requeue(
    deliveryId: string,
    maxAttempts: number,
  ): Promise<ReminderDelivery> {
    const delivery = await this.findById(deliveryId);
    if (
      delivery.status !== NotificationDeliveryStatus.DEAD_LETTER &&
      delivery.status !== NotificationDeliveryStatus.FAILED
    ) {
      throw new NotFoundException(
        'Solo se pueden reenviar entregas en estado FAILED o DEAD_LETTER.',
      );
    }

    delivery.status = NotificationDeliveryStatus.QUEUED;
    delivery.queuedAt = new Date();
    delivery.deadLetterAt = undefined;
    delivery.lastError = undefined;
    delivery.attempts = 0;
    delivery.maxAttempts = maxAttempts;
    return await this.reminderDeliveryRepository.save(delivery);
  }

  buildIdempotencyKey(reminderId: string, channel: Channel): string {
    return `${reminderId}:${channel}`;
  }

  async findByIdOrThrow(id: string): Promise<ReminderDelivery> {
    const delivery = await this.findById(id);
    if (!delivery) {
      throw new NotFoundException('Entrega no encontrada');
    }
    return delivery;
  }

  override async create(data: DeepPartial<ReminderDelivery>): Promise<ReminderDelivery> {
    return await this.reminderDeliveryRepository.save(
      this.reminderDeliveryRepository.create(data),
    );
  }
}
