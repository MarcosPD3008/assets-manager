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
  MaintenanceService,
  Maintenance,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  parseFiltersFromQuery,
} from '@libs/backend-config';
import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../decorators/api-crud.decorator';

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
