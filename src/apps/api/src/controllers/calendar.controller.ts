import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AssignmentService,
  MaintenanceService,
  Assignment,
  Maintenance,
  CalendarQueryDto,
} from '@libs/backend-config';
import { ApiGet } from '../decorators/api-crud.decorator';

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly assignmentService: AssignmentService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  @Get()
  @ApiGet({
    summary: 'Get calendar events for a specific month',
    description: 'Retrieve assignments and maintenances for a specific month/year. Query param: date (YYYY-MM-DD or YYYY-MM)',
    responseType: Object,
    isArray: false,
  })
  async getCalendar(
    @Query() query: CalendarQueryDto,
  ): Promise<{ assignments: Assignment[]; maintenances: Maintenance[] }> {
    // Parsear fecha (aceptar YYYY-MM-DD o YYYY-MM)
    const dateStr = query.date;
    let date: Date;

    if (dateStr.match(/^\d{4}-\d{2}$/)) {
      // Formato YYYY-MM
      date = new Date(dateStr + '-01');
    } else {
      // Formato YYYY-MM-DD
      date = new Date(dateStr);
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() retorna 0-11

    // Obtener assignments y maintenances en paralelo
    const [assignments, maintenances] = await Promise.all([
      this.assignmentService.findActiveByMonth(year, month),
      this.maintenanceService.findByMonth(year, month),
    ]);

    return {
      assignments,
      maintenances,
    };
  }
}
