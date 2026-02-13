import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, DeepPartial } from 'typeorm';
import { Assignment } from './assignment.entity';
import { BaseService } from '../../users/services/base.service';
import { AssignmentStatus, AssetStatus, TargetEntityType } from '../shared/enums';
import { Asset } from '../assets/asset.entity';
import { ReminderRuleService } from '../reminders/reminder-rule.service';

@Injectable()
export class AssignmentService extends BaseService<Assignment> {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly reminderRuleService: ReminderRuleService,
  ) {
    super(assignmentRepository);
  }

  override async create(data: DeepPartial<Assignment>): Promise<Assignment> {
    const status = data.status ?? AssignmentStatus.ACTIVE;
    if (status === AssignmentStatus.ACTIVE && !data.returnDate) {
      await this.assertSingleActiveAssignment(data.assetId as string);
    }

    const created = await super.create({
      ...data,
      status,
    });

    if (status === AssignmentStatus.ACTIVE) {
      await this.assetRepository.update(created.assetId, {
        status: AssetStatus.ASSIGNED,
      });
    }

    await this.reminderRuleService.regenerateForTarget(
      TargetEntityType.ASSIGNMENT,
      created.id,
    );

    return await this.findById(created.id, ['asset', 'assignee']);
  }

  override async update(id: string, data: DeepPartial<Assignment>): Promise<Assignment> {
    const existing = await this.findById(id, ['asset']);
    const previousAssetId = existing.assetId;
    const status = data.status ?? existing.status;
    const returnDate = data.returnDate ?? existing.returnDate;
    const assetId = (data.assetId ?? existing.assetId) as string;

    if (
      status === AssignmentStatus.ACTIVE &&
      !returnDate &&
      (assetId !== existing.assetId || existing.status !== AssignmentStatus.ACTIVE)
    ) {
      await this.assertSingleActiveAssignment(assetId, id);
    }

    const updated = await super.update(id, data);
    if (previousAssetId !== updated.assetId) {
      await this.syncAssetStatus(previousAssetId);
    }
    await this.syncAssetStatus(updated.assetId);
    await this.reminderRuleService.regenerateForTarget(
      TargetEntityType.ASSIGNMENT,
      updated.id,
    );
    return await this.findById(updated.id, ['asset', 'assignee']);
  }

  async closeAssignment(id: string): Promise<Assignment> {
    const assignment = await this.findById(id, ['asset', 'assignee']);
    assignment.closeAssignment();
    const updated = await this.assignmentRepository.save(assignment);
    await this.syncAssetStatus(updated.assetId);
    await this.reminderRuleService.regenerateForTarget(
      TargetEntityType.ASSIGNMENT,
      updated.id,
    );
    return updated;
  }

  async findActiveAssignments(): Promise<Assignment[]> {
    return await this.assignmentRepository.find({
      where: { status: AssignmentStatus.ACTIVE, returnDate: IsNull() },
      relations: ['asset', 'assignee'],
      order: { startDate: 'DESC' },
    });
  }

  async findByAsset(assetId: string): Promise<Assignment[]> {
    return await this.assignmentRepository.find({
      where: { assetId },
      relations: ['assignee'],
      order: { startDate: 'DESC' },
    });
  }

  async findByContact(contactId: string): Promise<Assignment[]> {
    return await this.assignmentRepository.find({
      where: { assigneeId: contactId },
      relations: ['asset'],
      order: { startDate: 'DESC' },
    });
  }

  async findActiveByMonth(year: number, month: number): Promise<Assignment[]> {
    // Calcular inicio y fin del mes
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    return await this.assignmentRepository.find({
      where: [
        {
          status: AssignmentStatus.ACTIVE,
          startDate: LessThanOrEqual(endOfMonth),
          dueDate: MoreThanOrEqual(startOfMonth),
        },
        {
          status: AssignmentStatus.ACTIVE,
          startDate: LessThanOrEqual(endOfMonth),
          isPermanent: true,
        },
      ],
      relations: ['asset', 'assignee'],
      order: { startDate: 'ASC' },
    });
  }

  private async assertSingleActiveAssignment(
    assetId: string,
    excludeAssignmentId?: string,
  ): Promise<void> {
    const qb = this.assignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.assetId = :assetId', { assetId })
      .andWhere('assignment.status = :status', { status: AssignmentStatus.ACTIVE })
      .andWhere('assignment.returnDate IS NULL')
      .andWhere('assignment.deletedAt IS NULL');

    if (excludeAssignmentId) {
      qb.andWhere('assignment.id != :excludeId', { excludeId: excludeAssignmentId });
    }

    const count = await qb.getCount();
    if (count > 0) {
      throw new ConflictException(
        'El activo ya tiene una asignacion activa. Debe cerrarla antes de crear otra.',
      );
    }
  }

  private async syncAssetStatus(assetId: string): Promise<void> {
    const activeCount = await this.assignmentRepository.count({
      where: {
        assetId,
        status: AssignmentStatus.ACTIVE,
        returnDate: IsNull(),
      },
    });

    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) {
      return;
    }

    if (activeCount > 0) {
      if (asset.status !== AssetStatus.MAINTENANCE) {
        await this.assetRepository.update(assetId, { status: AssetStatus.ASSIGNED });
      }
      return;
    }

    if (asset.status !== AssetStatus.MAINTENANCE) {
      await this.assetRepository.update(assetId, { status: AssetStatus.AVAILABLE });
    }
  }
}
