import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, And, DeepPartial } from 'typeorm';
import { Maintenance } from './maintenance.entity';
import { BaseService } from '../../users/services/base.service';
import { MaintenanceExecution } from './maintenance-execution.entity';
import { ExecuteMaintenanceDto } from './dto/maintenance-execution.dto';
import { ReminderRuleService } from '../reminders/reminder-rule.service';
import { TargetEntityType } from '../shared/enums';

@Injectable()
export class MaintenanceService extends BaseService<Maintenance> {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(MaintenanceExecution)
    private readonly executionRepository: Repository<MaintenanceExecution>,
    private readonly reminderRuleService: ReminderRuleService,
  ) {
    super(maintenanceRepository);
  }

  override async create(data: DeepPartial<Maintenance>): Promise<Maintenance> {
    const maintenance = this.maintenanceRepository.create(data);
    if (!maintenance.nextServiceDate) {
      maintenance.nextServiceDate = maintenance.calculateNextDate();
    }
    const created = await this.maintenanceRepository.save(maintenance);
    await this.reminderRuleService.regenerateForTarget(
      TargetEntityType.MAINTENANCE,
      created.id,
    );
    return await this.findById(created.id, ['asset']);
  }

  override async update(id: string, data: DeepPartial<Maintenance>): Promise<Maintenance> {
    const current = await this.findById(id, ['asset']);
    Object.assign(current, data);
    if (!data.nextServiceDate && current.lastServiceDate) {
      current.nextServiceDate = current.calculateNextDate();
    }
    const updated = await this.maintenanceRepository.save(current);
    await this.reminderRuleService.regenerateForTarget(
      TargetEntityType.MAINTENANCE,
      updated.id,
    );
    return await this.findById(updated.id, ['asset']);
  }

  calculateNextDate(maintenance: Maintenance): Date {
    return maintenance.calculateNextDate();
  }

  async findUpcomingMaintenance(days: number = 30): Promise<Maintenance[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return await this.maintenanceRepository.find({
      where: {
        nextServiceDate: MoreThanOrEqual(today),
      },
      relations: ['asset'],
      order: { nextServiceDate: 'ASC' },
    });
  }

  async findByAsset(assetId: string): Promise<Maintenance[]> {
    return await this.maintenanceRepository.find({
      where: { assetId },
      order: { nextServiceDate: 'ASC' },
    });
  }

  async findByMonth(year: number, month: number): Promise<Maintenance[]> {
    // Calcular inicio y fin del mes
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    return await this.maintenanceRepository.find({
      where: {
        nextServiceDate: And(
          MoreThanOrEqual(startOfMonth),
          LessThanOrEqual(endOfMonth),
        ),
      },
      relations: ['asset'],
      order: { nextServiceDate: 'ASC' },
    });
  }

  async executeMaintenance(
    id: string,
    data: ExecuteMaintenanceDto,
  ): Promise<{ maintenance: Maintenance; execution: MaintenanceExecution }> {
    const maintenance = await this.findById(id, ['asset']);
    const executedAt = data.executedAt ? new Date(data.executedAt) : new Date();

    const execution = this.executionRepository.create({
      maintenanceId: id,
      executedAt,
      cost: data.cost,
      serviceProvider: data.serviceProvider,
      notes: data.notes,
      performedBy: data.performedBy,
    });

    maintenance.lastServiceDate = executedAt;
    maintenance.nextServiceDate = maintenance.calculateNextDate();
    if (data.serviceProvider !== undefined) {
      maintenance.serviceProvider = data.serviceProvider;
    }
    if (data.cost !== undefined) {
      maintenance.cost = data.cost;
    }
    if (data.notes !== undefined) {
      maintenance.notes = data.notes;
    }

    const [savedExecution] = await Promise.all([
      this.executionRepository.save(execution),
      this.maintenanceRepository.save(maintenance),
    ]);

    await this.reminderRuleService.regenerateForTarget(
      TargetEntityType.MAINTENANCE,
      maintenance.id,
    );

    return {
      maintenance: await this.findById(maintenance.id, ['asset']),
      execution: savedExecution,
    };
  }

  async findExecutionHistory(maintenanceId: string): Promise<MaintenanceExecution[]> {
    await this.findById(maintenanceId);
    return await this.executionRepository.find({
      where: { maintenanceId },
      order: { executedAt: 'DESC' },
    });
  }

  async getCostSummary(
    month?: number,
    year?: number,
  ): Promise<{ total: number; byAsset: Array<{ assetId: string; assetName: string; total: number }> }> {
    let qb = this.executionRepository
      .createQueryBuilder('execution')
      .leftJoinAndSelect('execution.maintenance', 'maintenance')
      .leftJoinAndSelect('maintenance.asset', 'asset');

    if (month && year) {
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      qb = qb.where('execution.executedAt BETWEEN :start AND :end', {
        start: start.toISOString(),
        end: end.toISOString(),
      });
    }

    const executions = await qb.getMany();
    const byAssetMap = new Map<string, { assetId: string; assetName: string; total: number }>();
    let total = 0;

    for (const execution of executions) {
      const cost = Number(execution.cost ?? 0);
      total += cost;
      const assetId = execution.maintenance?.assetId ?? 'unknown';
      const assetName = execution.maintenance?.asset?.name ?? 'Sin nombre';
      const existing = byAssetMap.get(assetId);
      if (existing) {
        existing.total += cost;
      } else {
        byAssetMap.set(assetId, { assetId, assetName, total: cost });
      }
    }

    return {
      total,
      byAsset: Array.from(byAssetMap.values()).sort((a, b) => b.total - a.total),
    };
  }
}
