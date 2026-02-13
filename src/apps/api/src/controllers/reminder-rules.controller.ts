import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ReminderRuleService,
  ReminderRule,
  CreateReminderRuleDto,
  UpdateReminderRuleDto,
  parseFiltersFromQuery,
} from '@libs/backend-config';
import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../decorators/api-crud.decorator';

@ApiTags('Reminder Rules')
@Controller('reminder-rules')
export class ReminderRulesController {
  constructor(private readonly reminderRuleService: ReminderRuleService) {}

  @Get()
  @ApiGet({
    summary: 'Get all reminder rules',
    description: 'Retrieve paginated reminder rules',
    responseType: ReminderRule,
    isPaginated: true,
  })
  async findAll(
    @Query() query: Record<string, any>,
  ): Promise<{ items: ReminderRule[]; total: number }> {
    const page = parseInt(query.page as string, 10) || 1;
    const pageSize = parseInt(query.pageSize as string, 10) || 10;
    const where = parseFiltersFromQuery<ReminderRule>(query);

    return await this.reminderRuleService.findAllPaginated({
      where: Object.keys(where).length > 0 ? where : undefined,
      page,
      pageSize,
    });
  }

  @Get(':id')
  @ApiGet({
    summary: 'Get reminder rule by ID',
    description: 'Retrieve a reminder rule by ID',
    responseType: ReminderRule,
    paramName: 'id',
    paramDescription: 'ReminderRule UUID',
  })
  async findOne(@Param('id') id: string): Promise<ReminderRule> {
    return await this.reminderRuleService.findById(id);
  }

  @Post()
  @ApiPost({
    summary: 'Create reminder rule',
    description: 'Create a relative reminder rule for assignment or maintenance',
    responseType: ReminderRule,
    bodyType: CreateReminderRuleDto,
  })
  async create(
    @Body() createReminderRuleDto: CreateReminderRuleDto,
  ): Promise<ReminderRule> {
    return await this.reminderRuleService.createRule(createReminderRuleDto);
  }

  @Put(':id')
  @ApiPut({
    summary: 'Update reminder rule',
    description: 'Update an existing reminder rule',
    responseType: ReminderRule,
    bodyType: UpdateReminderRuleDto,
    paramName: 'id',
    paramDescription: 'ReminderRule UUID',
  })
  async update(
    @Param('id') id: string,
    @Body() updateReminderRuleDto: UpdateReminderRuleDto,
  ): Promise<ReminderRule> {
    return await this.reminderRuleService.updateRule(id, updateReminderRuleDto);
  }

  @Post(':id/generate-preview')
  @ApiPost({
    summary: 'Generate reminder preview',
    description: 'Calculate due date and scheduled date for the rule',
    responseType: Object,
    paramName: 'id',
    paramDescription: 'ReminderRule UUID',
  })
  async generatePreview(
    @Param('id') id: string,
  ): Promise<{ dueDate: Date; scheduledDate: Date }> {
    return await this.reminderRuleService.generatePreview(id);
  }

  @Delete(':id')
  @ApiDelete({
    summary: 'Delete reminder rule',
    description: 'Delete reminder rule by ID',
    paramName: 'id',
    paramDescription: 'ReminderRule UUID',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.reminderRuleService.remove(id);
  }
}
