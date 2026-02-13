import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AssignmentService,
  MaintenanceService,
  ReminderService,
  Assignment,
  Maintenance,
  Reminder,
  CalendarQueryDto,
} from '@libs/backend-config';
import { ApiGet } from '../decorators/api-crud.decorator';

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly assignmentService: AssignmentService,
    private readonly maintenanceService: MaintenanceService,
    private readonly reminderService: ReminderService,
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
  ): Promise<{
    assignments: Assignment[];
    maintenances: Maintenance[];
    reminders: Reminder[];
  }> {
    // Parse manual para evitar desfases de zona horaria al usar new Date('YYYY-MM-DD')
    const dateStr = query.date;
    const match = dateStr.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!match) {
      throw new BadRequestException(
        'Formato de fecha inválido. Use YYYY-MM o YYYY-MM-DD',
      );
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);

    // Obtener assignments y maintenances en paralelo
    const [assignments, maintenances, reminders] = await Promise.all([
      this.assignmentService.findActiveByMonth(year, month),
      this.maintenanceService.findByMonth(year, month),
      this.reminderService.findByMonth(year, month),
    ]);

    return {
      assignments,
      maintenances,
      reminders,
    };
  }
}
