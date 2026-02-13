import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReminderRule } from './reminder-rule.entity';
import { BaseService } from '../../users/services/base.service';
import {
  ReminderOffsetUnit,
  ReminderSourceType,
  ReminderStatus,
  ReminderType,
  TargetEntityType,
  TargetType,
  Channel,
} from '../shared/enums';
import { Assignment } from '../assignments/assignment.entity';
import { Maintenance } from '../maintenances/maintenance.entity';
import { Reminder } from './reminder.entity';
import { CreateReminderRuleDto, UpdateReminderRuleDto } from './dto/reminder-rule.dto';

@Injectable()
export class ReminderRuleService extends BaseService<ReminderRule> {
  constructor(
    @InjectRepository(ReminderRule)
    private readonly reminderRuleRepository: Repository<ReminderRule>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
  ) {
    super(reminderRuleRepository);
  }

  async createRule(data: CreateReminderRuleDto): Promise<ReminderRule> {
    const rule = await this.create({
      ...data,
      active: data.active ?? true,
      priority: data.priority,
      channel: data.channel ?? Channel.IN_APP,
      targetType: data.targetType ?? TargetType.SYSTEM,
    });
    await this.generateFromRule(rule.id);
    return await this.findById(rule.id);
  }

  async updateRule(id: string, data: UpdateReminderRuleDto): Promise<ReminderRule> {
    const updated = await this.update(id, data);
    await this.generateFromRule(updated.id);
    return await this.findById(id);
  }

  async generatePreview(id: string): Promise<{ dueDate: Date; scheduledDate: Date }> {
    const rule = await this.findById(id);
    const dueDate = await this.getDueDate(rule);
    const scheduledDate = this.calculateScheduledDate(dueDate, rule.offsetValue, rule.offsetUnit);
    return { dueDate, scheduledDate };
  }

  async generateFromRule(id: string): Promise<Reminder | null> {
    const rule = await this.findById(id);
    if (!rule.active) {
      return null;
    }

    const dueDate = await this.getDueDate(rule);
    const scheduledDate = this.calculateScheduledDate(dueDate, rule.offsetValue, rule.offsetUnit);
    const targetData = await this.resolveTarget(rule);

    await this.reminderRepository.delete({
      reminderRuleId: rule.id,
      sourceType: ReminderSourceType.RULE,
      status: ReminderStatus.PENDING,
    });

    const reminder = this.reminderRepository.create({
      message: rule.messageTemplate || targetData.defaultMessage,
      scheduledDate,
      status: ReminderStatus.PENDING,
      sourceType: ReminderSourceType.RULE,
      type: targetData.type,
      targetType: rule.targetType,
      targetId: targetData.targetId,
      priority: rule.priority,
      channel: rule.channel,
      assignmentId: targetData.assignmentId,
      maintenanceId: targetData.maintenanceId,
      reminderRuleId: rule.id,
    });

    return await this.reminderRepository.save(reminder);
  }

  async regenerateForTarget(
    targetEntityType: TargetEntityType,
    targetEntityId: string,
  ): Promise<void> {
    const rules = await this.reminderRuleRepository.find({
      where: {
        targetEntityType,
        targetEntityId,
        active: true,
      },
    });

    for (const rule of rules) {
      await this.generateFromRule(rule.id);
    }
  }

  private calculateScheduledDate(
    dueDate: Date,
    offsetValue: number,
    offsetUnit: ReminderOffsetUnit,
  ): Date {
    const scheduledDate = new Date(dueDate);
    switch (offsetUnit) {
      case ReminderOffsetUnit.DAY:
        scheduledDate.setDate(scheduledDate.getDate() - offsetValue);
        break;
      case ReminderOffsetUnit.WEEK:
        scheduledDate.setDate(scheduledDate.getDate() - offsetValue * 7);
        break;
      case ReminderOffsetUnit.MONTH:
        scheduledDate.setMonth(scheduledDate.getMonth() - offsetValue);
        break;
      default:
        scheduledDate.setDate(scheduledDate.getDate() - offsetValue);
        break;
    }
    return scheduledDate;
  }

  private async getDueDate(rule: ReminderRule): Promise<Date> {
    if (rule.targetEntityType === TargetEntityType.ASSIGNMENT) {
      const assignment = await this.assignmentRepository.findOne({
        where: { id: rule.targetEntityId },
      });
      if (!assignment) {
        throw new NotFoundException('Asignacion no encontrada para la regla');
      }
      return assignment.dueDate ?? assignment.startDate;
    }

    const maintenance = await this.maintenanceRepository.findOne({
      where: { id: rule.targetEntityId },
    });
    if (!maintenance) {
      throw new NotFoundException('Mantenimiento no encontrado para la regla');
    }
    return maintenance.nextServiceDate ?? maintenance.calculateNextDate();
  }

  private async resolveTarget(rule: ReminderRule): Promise<{
    type: ReminderType;
    targetId: string;
    assignmentId?: string;
    maintenanceId?: string;
    defaultMessage: string;
  }> {
    if (rule.targetEntityType === TargetEntityType.ASSIGNMENT) {
      const assignment = await this.assignmentRepository.findOne({
        where: { id: rule.targetEntityId },
        relations: ['asset', 'assignee'],
      });
      if (!assignment) {
        throw new NotFoundException('Asignacion no encontrada para la regla');
      }
      const dueDate = assignment.dueDate ?? assignment.startDate;
      return {
        type: ReminderType.ASSIGNMENT,
        targetId: assignment.assigneeId,
        assignmentId: assignment.id,
        defaultMessage: `Recordatorio: la asignacion del activo "${assignment.asset?.name ?? 'Activo'}" vence el ${dueDate.toLocaleDateString('es-CO')}.`,
      };
    }

    const maintenance = await this.maintenanceRepository.findOne({
      where: { id: rule.targetEntityId },
      relations: ['asset'],
    });
    if (!maintenance) {
      throw new NotFoundException('Mantenimiento no encontrado para la regla');
    }
    const dueDate = maintenance.nextServiceDate ?? maintenance.calculateNextDate();
    return {
      type: ReminderType.MAINTENANCE,
      targetId: maintenance.assetId,
      maintenanceId: maintenance.id,
      defaultMessage: `Recordatorio: el mantenimiento de "${maintenance.asset?.name ?? 'Activo'}" vence el ${dueDate.toLocaleDateString('es-CO')}.`,
    };
  }
}
