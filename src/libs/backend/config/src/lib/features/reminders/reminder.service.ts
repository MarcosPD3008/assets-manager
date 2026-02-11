import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Reminder } from './reminder.entity';
import { BaseService } from '../../users/services/base.service';
import { TargetType } from '../shared/enums';

@Injectable()
export class ReminderService extends BaseService<Reminder> {
  constructor(
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
  ) {
    super(reminderRepository);
  }

  async findPendingReminders(): Promise<Reminder[]> {
    const now = new Date();
    return await this.reminderRepository.find({
      where: {
        isSent: false,
        scheduledDate: LessThanOrEqual(now),
      },
      order: { scheduledDate: 'ASC' },
    });
  }

  async markAsSent(id: string): Promise<Reminder> {
    const reminder = await this.findById(id);
    reminder.isSent = true;
    return await this.reminderRepository.save(reminder);
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
}
