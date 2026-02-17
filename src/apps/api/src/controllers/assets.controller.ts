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
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  AssetService,
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  UpdateStatusDto,
  parseFiltersFromQuery,
  AssetStatus,
  AssetStatusLabels,
} from '@libs/backend-config';
import { ApiGet, ApiPost, ApiPut, ApiPatch, ApiDelete } from '../decorators/api-crud.decorator';
import { ApiExport } from '../decorators/api-export.decorator';
import { EntityExportService } from '../modules/export/entity-export.service';
import { BulkImportService } from '../modules/import/bulk-import.service';
import { CommitBulkImportDto, ValidateBulkImportDto } from '../modules/import/dto/bulk-import.dto';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetService: AssetService,
    private readonly entityExportService: EntityExportService,
    private readonly bulkImportService: BulkImportService,
  ) {}

  @Get()
  @ApiGet({
    summary: 'Get all assets',
    description: 'Retrieve a paginated list of assets. Supports OData filters: filter=status eq AVAILABLE and price gt 1000. Query params: page (default: 1), pageSize (default: 10)',
    responseType: Asset,
    isPaginated: true,
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

  @Get('export')
  @ApiExport({
    summary: 'Export assets',
    description: 'Exporta activos en Excel o PDF con columnas traducidas y enums con etiqueta.',
  })
  async export(
    @Query() query: Record<string, any>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const exportFile = await this.entityExportService.exportFromQuery({
      entity: Asset,
      source: this.assetService,
      query,
      fileNameFallback: 'assets',
    });

    response.setHeader('Content-Type', exportFile.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${exportFile.fileName}"`);
    response.setHeader('Content-Length', exportFile.buffer.length.toString());
    return new StreamableFile(exportFile.buffer);
  }

  @Post('import/validate')
  @ApiOperation({
    summary: 'Validate bulk import for assets',
    description: 'Valida filas mapeadas para importación masiva de activos. No inserta datos.',
  })
  @ApiBody({ type: ValidateBulkImportDto })
  @ApiOkResponse({ description: 'Resultado de validación por fila.' })
  validateBulkImport(@Body() body: ValidateBulkImportDto) {
    return this.bulkImportService.validateRows({
      entityName: 'asset',
      dtoClass: CreateAssetDto,
      fields: [
        { key: 'name', required: true, type: 'string' },
        { key: 'description', type: 'string' },
        { key: 'serialNumber', type: 'string' },
        { key: 'status', type: 'enum', enumValues: Object.values(AssetStatus), enumAliases: this.getAssetStatusAliases() },
        { key: 'category', type: 'string' },
        { key: 'location', type: 'string' },
        { key: 'purchaseDate', type: 'date' },
        { key: 'purchasePrice', type: 'number' },
        { key: 'warrantyExpiryDate', type: 'date' },
        { key: 'metadata', type: 'json' },
      ],
      create: async (payload) => await this.assetService.create(payload),
    }, body.rows);
  }

  @Post('import/commit')
  @ApiOperation({
    summary: 'Commit bulk import for assets',
    description: 'Inserta filas validadas para importación masiva de activos.',
  })
  @ApiBody({ type: CommitBulkImportDto })
  @ApiOkResponse({ description: 'Resumen de inserción masiva.' })
  async commitBulkImport(@Body() body: CommitBulkImportDto) {
    return await this.bulkImportService.commitRows({
      entityName: 'asset',
      dtoClass: CreateAssetDto,
      fields: [
        { key: 'name', required: true, type: 'string' },
        { key: 'description', type: 'string' },
        { key: 'serialNumber', type: 'string' },
        { key: 'status', type: 'enum', enumValues: Object.values(AssetStatus), enumAliases: this.getAssetStatusAliases() },
        { key: 'category', type: 'string' },
        { key: 'location', type: 'string' },
        { key: 'purchaseDate', type: 'date' },
        { key: 'purchasePrice', type: 'number' },
        { key: 'warrantyExpiryDate', type: 'date' },
        { key: 'metadata', type: 'json' },
      ],
      create: async (payload) => await this.assetService.create(payload),
    }, body.rows);
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
    bodyType: UpdateStatusDto,
    paramName: 'id',
    paramDescription: 'Asset UUID',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ): Promise<Asset> {
    return await this.assetService.updateStatus(id, updateStatusDto.status as any);
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

  private getAssetStatusAliases(): Record<string, string> {
    return Object.entries(AssetStatusLabels).reduce<Record<string, string>>((aliases, [status, label]) => {
      aliases[label.toLowerCase()] = status;
      return aliases;
    }, {});
  }
}
