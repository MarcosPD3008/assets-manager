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
  MaintenanceService,
  Maintenance,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  ExecuteMaintenanceDto,
  MaintenanceExecution,
  parseFiltersFromQuery,
} from '@libs/backend-config';
import { ApiGet, ApiPost, ApiPut, ApiPatch, ApiDelete } from '../decorators/api-crud.decorator';

@ApiTags('Maintenances')
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @ApiGet({
    summary: 'Get all maintenances',
    description: 'Retrieve a paginated list of maintenances. Supports OData filters: filter=assetId eq uuid. Query params: page (default: 1), pageSize (default: 10)',
    responseType: Maintenance,
    isPaginated: true,
  })
  async findAll(@Query() query: Record<string, any>): Promise<{ items: Maintenance[]; total: number }> {
    const page = parseInt(query.page as string, 10) || 1;
    const pageSize = parseInt(query.pageSize as string, 10) || 10;
    const where = parseFiltersFromQuery<Maintenance>(query);

    return await this.maintenanceService.findAllPaginated({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: ['asset'],
      page,
      pageSize,
    });
  }

  @Get(':id')
  @ApiGet({
    summary: 'Get maintenance by ID',
    description: 'Retrieve a single maintenance by its ID',
    responseType: Maintenance,
    paramName: 'id',
    paramDescription: 'Maintenance UUID',
  })
  async findOne(@Param('id') id: string): Promise<Maintenance> {
    return await this.maintenanceService.findById(id, ['asset']);
  }

  @Post()
  @ApiPost({
    summary: 'Create a new maintenance',
    description: 'Create a new maintenance schedule with the provided data',
    responseType: Maintenance,
    bodyType: CreateMaintenanceDto,
  })
  async create(@Body() createMaintenanceDto: CreateMaintenanceDto): Promise<Maintenance> {
    return await this.maintenanceService.create(createMaintenanceDto);
  }

  @Put(':id')
  @ApiPut({
    summary: 'Update a maintenance',
    description: 'Update an existing maintenance with the provided data',
    responseType: Maintenance,
    bodyType: UpdateMaintenanceDto,
    paramName: 'id',
    paramDescription: 'Maintenance UUID',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
  ): Promise<Maintenance> {
    return await this.maintenanceService.update(id, updateMaintenanceDto);
  }

  @Patch(':id/execute')
  @ApiPatch({
    summary: 'Execute maintenance',
    description: 'Register maintenance execution, update dates and regenerate rule reminders',
    responseType: Object,
    bodyType: ExecuteMaintenanceDto,
    paramName: 'id',
    paramDescription: 'Maintenance UUID',
  })
  async execute(
    @Param('id') id: string,
    @Body() executeMaintenanceDto: ExecuteMaintenanceDto,
  ): Promise<{ maintenance: Maintenance; execution: MaintenanceExecution }> {
    return await this.maintenanceService.executeMaintenance(id, executeMaintenanceDto);
  }

  @Get(':id/history')
  @ApiGet({
    summary: 'Get maintenance execution history',
    description: 'Retrieve all executions for a maintenance ordered by most recent first',
    responseType: MaintenanceExecution,
    isArray: true,
    paramName: 'id',
    paramDescription: 'Maintenance UUID',
  })
  async history(@Param('id') id: string): Promise<MaintenanceExecution[]> {
    return await this.maintenanceService.findExecutionHistory(id);
  }

  @Get('cost-summary/monthly')
  @ApiGet({
    summary: 'Get maintenance monthly cost summary',
    description: 'Retrieve total and per-asset costs for an optional month/year period',
    responseType: Object,
  })
  async getCostSummary(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<{ total: number; byAsset: Array<{ assetId: string; assetName: string; total: number }> }> {
    return await this.maintenanceService.getCostSummary(
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Delete(':id')
  @ApiDelete({
    summary: 'Delete a maintenance',
    description: 'Delete a maintenance by its ID',
    paramName: 'id',
    paramDescription: 'Maintenance UUID',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.maintenanceService.remove(id);
  }
}
