import {
  Controller,
  Get,
  Post,
  Put,
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
  ContactService,
  Contact,
  CreateContactDto,
  UpdateContactDto,
  parseFiltersFromQuery,
} from '@libs/backend-config';
import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../decorators/api-crud.decorator';
import { ApiExport } from '../decorators/api-export.decorator';
import { EntityExportService } from '../modules/export/entity-export.service';
import { BulkImportService } from '../modules/import/bulk-import.service';
import { CommitBulkImportDto, ValidateBulkImportDto } from '../modules/import/dto/bulk-import.dto';

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactService: ContactService,
    private readonly entityExportService: EntityExportService,
    private readonly bulkImportService: BulkImportService,
  ) {}

  @Get()
  @ApiGet({
    summary: 'Get all contacts',
    description: 'Retrieve a paginated list of contacts. Supports OData filters: filter=email contains @example.com. Query params: page (default: 1), pageSize (default: 10)',
    responseType: Contact,
    isPaginated: true,
  })
  async findAll(@Query() query: Record<string, any>): Promise<{ items: Contact[]; total: number }> {
    const page = parseInt(query.page as string, 10) || 1;
    const pageSize = parseInt(query.pageSize as string, 10) || 10;
    const where = parseFiltersFromQuery<Contact>(query);

    return await this.contactService.findAllPaginated({
      where: Object.keys(where).length > 0 ? where : undefined,
      page,
      pageSize,
    });
  }

  @Get('export')
  @ApiExport({
    summary: 'Export contacts',
    description: 'Exporta contactos en Excel o PDF con columnas traducidas y formatos consistentes.',
  })
  async export(
    @Query() query: Record<string, any>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const exportFile = await this.entityExportService.exportFromQuery({
      entity: Contact,
      source: this.contactService,
      query,
      fileNameFallback: 'contacts',
    });

    response.setHeader('Content-Type', exportFile.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${exportFile.fileName}"`);
    response.setHeader('Content-Length', exportFile.buffer.length.toString());
    return new StreamableFile(exportFile.buffer);
  }

  @Post('import/validate')
  @ApiOperation({
    summary: 'Validate bulk import for contacts',
    description: 'Valida filas mapeadas para importación masiva de contactos. No inserta datos.',
  })
  @ApiBody({ type: ValidateBulkImportDto })
  @ApiOkResponse({ description: 'Resultado de validación por fila.' })
  validateBulkImport(@Body() body: ValidateBulkImportDto) {
    return this.bulkImportService.validateRows({
      entityName: 'contact',
      dtoClass: CreateContactDto,
      fields: [
        { key: 'name', required: true, type: 'string' },
        { key: 'email', required: true, type: 'email' },
        { key: 'phoneNumber', type: 'string' },
        { key: 'department', type: 'string' },
        { key: 'position', type: 'string' },
        { key: 'notes', type: 'string' },
        { key: 'metadata', type: 'json' },
      ],
      create: async (payload) => await this.contactService.create(payload),
    }, body.rows);
  }

  @Post('import/commit')
  @ApiOperation({
    summary: 'Commit bulk import for contacts',
    description: 'Inserta filas validadas para importación masiva de contactos.',
  })
  @ApiBody({ type: CommitBulkImportDto })
  @ApiOkResponse({ description: 'Resumen de inserción masiva.' })
  async commitBulkImport(@Body() body: CommitBulkImportDto) {
    return await this.bulkImportService.commitRows({
      entityName: 'contact',
      dtoClass: CreateContactDto,
      fields: [
        { key: 'name', required: true, type: 'string' },
        { key: 'email', required: true, type: 'email' },
        { key: 'phoneNumber', type: 'string' },
        { key: 'department', type: 'string' },
        { key: 'position', type: 'string' },
        { key: 'notes', type: 'string' },
        { key: 'metadata', type: 'json' },
      ],
      create: async (payload) => await this.contactService.create(payload),
    }, body.rows);
  }

  @Get(':id')
  @ApiGet({
    summary: 'Get contact by ID',
    description: 'Retrieve a single contact by its ID',
    responseType: Contact,
    paramName: 'id',
    paramDescription: 'Contact UUID',
  })
  async findOne(@Param('id') id: string): Promise<Contact> {
    return await this.contactService.findById(id);
  }

  @Post()
  @ApiPost({
    summary: 'Create a new contact',
    description: 'Create a new contact with the provided data',
    responseType: Contact,
    bodyType: CreateContactDto,
  })
  async create(@Body() createContactDto: CreateContactDto): Promise<Contact> {
    return await this.contactService.create(createContactDto);
  }

  @Put(':id')
  @ApiPut({
    summary: 'Update a contact',
    description: 'Update an existing contact with the provided data',
    responseType: Contact,
    bodyType: UpdateContactDto,
    paramName: 'id',
    paramDescription: 'Contact UUID',
  })
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    return await this.contactService.update(id, updateContactDto);
  }

  @Delete(':id')
  @ApiDelete({
    summary: 'Delete a contact',
    description: 'Delete a contact by its ID',
    paramName: 'id',
    paramDescription: 'Contact UUID',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.contactService.remove(id);
  }
}
