import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LessThanOrEqual } from 'typeorm';
import {
  AssetService,
  AssignmentService,
  MaintenanceService,
  ReminderService,
  ReminderStatus,
  AssignmentStatus,
} from '@libs/backend-config';

export interface DashboardSummary {
  activosTotales: number;
  remindersPendientes: number;
  mantenimientosProximos: number;
  asignacionesActivas: number;
}

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly assetService: AssetService,
    private readonly assignmentService: AssignmentService,
    private readonly maintenanceService: MaintenanceService,
    private readonly reminderService: ReminderService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard KPI summary' })
  @ApiOkResponse({ description: 'Dashboard counts for KPI cards' })
  async getSummary(): Promise<DashboardSummary> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 30);

    const [activosTotales, remindersPendientes, mantenimientosProximos, asignacionesActivas] =
      await Promise.all([
        this.assetService.count(),
        this.reminderService.count({ where: { status: ReminderStatus.PENDING } }),
        this.maintenanceService.count({
          where: { nextServiceDate: LessThanOrEqual(fechaLimite) },
        }),
        this.assignmentService.count({ where: { status: AssignmentStatus.ACTIVE } }),
      ]);

    return { activosTotales, remindersPendientes, mantenimientosProximos, asignacionesActivas };
  }
}
