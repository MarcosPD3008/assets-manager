import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Reminder } from './reminder.entity';
import { BaseService } from '../../users/services/base.service';
import { ReminderStatus, TargetType } from '../shared/enums';
import { ReminderDeliveryService } from './reminder-delivery.service';

@Injectable()
export class ReminderService extends BaseService<Reminder> {
  constructor(
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
    private readonly reminderDeliveryService: ReminderDeliveryService,
  ) {
    super(reminderRepository);
  }

  async findPendingReminders(): Promise<Reminder[]> {
    await this.markOverdueReminders();
    const now = new Date();
    return await this.reminderRepository.find({
      where: {
        status: In([ReminderStatus.PENDING, ReminderStatus.OVERDUE]),
        scheduledDate: LessThanOrEqual(now),
      },
      order: { scheduledDate: 'ASC' },
    });
  }

  async findDueForDispatch(now: Date = new Date()): Promise<Reminder[]> {
    return await this.reminderRepository.find({
      where: {
        status: In([ReminderStatus.PENDING, ReminderStatus.OVERDUE]),
        scheduledDate: LessThanOrEqual(now),
      },
      order: { scheduledDate: 'ASC' },
    });
  }

  async markAsSent(id: string): Promise<Reminder> {
    const reminder = await this.findById(id);
    reminder.status = ReminderStatus.SENT;
    const saved = await this.reminderRepository.save(reminder);
    await this.reminderDeliveryService.markAsSentByReminder(id);
    return saved;
  }

  async markOverdueReminders(): Promise<number> {
    const now = new Date();
    const result = await this.reminderRepository
      .createQueryBuilder()
      .update(Reminder)
      .set({ status: ReminderStatus.OVERDUE })
      .where(`status = :pending`, { pending: ReminderStatus.PENDING })
      .andWhere(`"scheduledDate" < :now`, { now: now.toISOString() })
      .execute();

    return result.affected ?? 0;
  }

  async findByTarget(
    targetType: string,
    targetId: string,
  ): Promise<Reminder[]> {
    return await this.reminderRepository.find({
      where: {
        targetType: targetType as TargetType,
        targetId,
      },
      order: { scheduledDate: 'ASC' },
    });
  }

  async findByMonth(year: number, month: number): Promise<Reminder[]> {
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    return await this.reminderRepository
      .createQueryBuilder('reminder')
      .where('reminder.scheduledDate BETWEEN :start AND :end', {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      })
      .orderBy('reminder.scheduledDate', 'ASC')
      .getMany();
  }
}
