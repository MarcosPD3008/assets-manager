import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ReminderService,
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  parseFiltersFromQuery,
} from '@libs/backend-config';
import { ApiGet, ApiPost, ApiPut, ApiPatch, ApiDelete } from '../decorators/api-crud.decorator';

@ApiTags('Reminders')
@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminderService: ReminderService) {}

  @Get()
  @ApiGet({
    summary: 'Get all reminders',
    description: 'Retrieve a paginated list of reminders. Supports OData filters: filter=isSent eq false. Query params: page (default: 1), pageSize (default: 10)',
    responseType: Reminder,
    isArray: false,
  })
  async findAll(@Query() query: Record<string, any>): Promise<{ items: Reminder[]; total: number }> {
    const page = parseInt(query.page as string, 10) || 1;
    const pageSize = parseInt(query.pageSize as string, 10) || 10;
    const where = parseFiltersFromQuery<Reminder>(query);

    return await this.reminderService.findAllPaginated({
      where: Object.keys(where).length > 0 ? where : undefined,
      page,
      pageSize,
    });
  }

  @Get(':id')
  @ApiGet({
    summary: 'Get reminder by ID',
    description: 'Retrieve a single reminder by its ID',
    responseType: Reminder,
    paramName: 'id',
    paramDescription: 'Reminder UUID',
  })
  async findOne(@Param('id') id: string): Promise<Reminder> {
    return await this.reminderService.findById(id);
  }

  @Post()
  @ApiPost({
    summary: 'Create a new reminder',
    description: 'Create a new reminder with the provided data',
    responseType: Reminder,
    bodyType: CreateReminderDto,
  })
  async create(@Body() createReminderDto: CreateReminderDto): Promise<Reminder> {
    return await this.reminderService.create(createReminderDto);
  }

  @Put(':id')
  @ApiPut({
    summary: 'Update a reminder',
    description: 'Update an existing reminder with the provided data',
    responseType: Reminder,
    bodyType: UpdateReminderDto,
    paramName: 'id',
    paramDescription: 'Reminder UUID',
  })
  async update(
    @Param('id') id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ): Promise<Reminder> {
    return await this.reminderService.update(id, updateReminderDto);
  }

  @Patch(':id/mark-sent')
  @ApiPatch({
    summary: 'Mark reminder as sent',
    description: 'Mark a reminder as sent',
    responseType: Reminder,
    paramName: 'id',
    paramDescription: 'Reminder UUID',
  })
  async markAsSent(@Param('id') id: string): Promise<Reminder> {
    return await this.reminderService.markAsSent(id);
  }

  @Delete(':id')
  @ApiDelete({
    summary: 'Delete a reminder',
    description: 'Delete a reminder by its ID',
    paramName: 'id',
    paramDescription: 'Reminder UUID',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.reminderService.remove(id);
  }
}
