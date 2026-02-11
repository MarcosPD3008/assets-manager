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
  ContactService,
  Contact,
  CreateContactDto,
  UpdateContactDto,
  parseFiltersFromQuery,
} from '@libs/backend-config';
import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../decorators/api-crud.decorator';

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactService: ContactService) {}

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
