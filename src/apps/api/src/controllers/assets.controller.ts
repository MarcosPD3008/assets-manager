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
  AssetService,
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  parseFiltersFromQuery,
} from '@libs/backend-config';
import { ApiGet, ApiPost, ApiPut, ApiPatch, ApiDelete } from '../decorators/api-crud.decorator';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @ApiGet({
    summary: 'Get all assets',
    description: 'Retrieve a paginated list of assets. Supports OData filters: filter=status eq AVAILABLE and price gt 1000. Query params: page (default: 1), pageSize (default: 10)',
    responseType: Asset,
    isArray: false,
  })
  async findAll(@Query() query: Record<string, any>): Promise<{ items: Asset[]; total: number }> {
    const page = parseInt(query.page as string, 10) || 1;
    const pageSize = parseInt(query.pageSize as string, 10) || 10;
    const where = parseFiltersFromQuery<Asset>(query);

    return await this.assetService.findAllPaginated({
      where: Object.keys(where).length > 0 ? where : undefined,
      page,
      pageSize,
    });
  }

  @Get(':id')
  @ApiGet({
    summary: 'Get asset by ID',
    description: 'Retrieve a single asset by its ID',
    responseType: Asset,
    paramName: 'id',
    paramDescription: 'Asset UUID',
  })
  async findOne(@Param('id') id: string): Promise<Asset> {
    return await this.assetService.findById(id);
  }

  @Post()
  @ApiPost({
    summary: 'Create a new asset',
    description: 'Create a new asset with the provided data',
    responseType: Asset,
    bodyType: CreateAssetDto,
  })
  async create(@Body() createAssetDto: CreateAssetDto): Promise<Asset> {
    return await this.assetService.create(createAssetDto);
  }

  @Put(':id')
  @ApiPut({
    summary: 'Update an asset',
    description: 'Update an existing asset with the provided data',
    responseType: Asset,
    bodyType: UpdateAssetDto,
    paramName: 'id',
    paramDescription: 'Asset UUID',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
  ): Promise<Asset> {
    return await this.assetService.update(id, updateAssetDto);
  }

  @Patch(':id/status')
  @ApiPatch({
    summary: 'Update asset status',
    description: 'Update only the status of an asset',
    responseType: Asset,
    paramName: 'id',
    paramDescription: 'Asset UUID',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<Asset> {
    return await this.assetService.updateStatus(id, status as any);
  }

  @Delete(':id')
  @ApiDelete({
    summary: 'Delete an asset',
    description: 'Delete an asset by its ID',
    paramName: 'id',
    paramDescription: 'Asset UUID',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.assetService.remove(id);
  }
}
