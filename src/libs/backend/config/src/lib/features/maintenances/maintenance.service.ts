import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, And } from 'typeorm';
import { Maintenance } from './maintenance.entity';
import { BaseService } from '../../users/services/base.service';

@Injectable()
export class MaintenanceService extends BaseService<Maintenance> {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
  ) {
    super(maintenanceRepository);
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
}
