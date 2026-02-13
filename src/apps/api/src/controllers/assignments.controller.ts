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
  AssignmentService,
  Assignment,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  parseFiltersFromQuery,
} from '@libs/backend-config';
import { ApiGet, ApiPost, ApiPut, ApiPatch, ApiDelete } from '../decorators/api-crud.decorator';

@ApiTags('Assignments')
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get()
  @ApiGet({
    summary: 'Get all assignments',
    description: 'Retrieve a paginated list of assignments. Supports OData filters: filter=status eq ACTIVE. Query params: page (default: 1), pageSize (default: 10)',
    responseType: Assignment,
    isPaginated: true,
  })
  async findAll(@Query() query: Record<string, any>): Promise<{ items: Assignment[]; total: number }> {
    const page = parseInt(query.page as string, 10) || 1;
    const pageSize = parseInt(query.pageSize as string, 10) || 10;
    const where = parseFiltersFromQuery<Assignment>(query);

    return await this.assignmentService.findAllPaginated({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: ['asset', 'assignee'],
      page,
      pageSize,
    });
  }

  @Get(':id')
  @ApiGet({
    summary: 'Get assignment by ID',
    description: 'Retrieve a single assignment by its ID',
    responseType: Assignment,
    paramName: 'id',
    paramDescription: 'Assignment UUID',
  })
  async findOne(@Param('id') id: string): Promise<Assignment> {
    return await this.assignmentService.findById(id, ['asset', 'assignee']);
  }

  @Post()
  @ApiPost({
    summary: 'Create a new assignment',
    description: 'Create a new assignment with the provided data',
    responseType: Assignment,
    bodyType: CreateAssignmentDto,
  })
  async create(@Body() createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    return await this.assignmentService.create(createAssignmentDto);
  }

  @Put(':id')
  @ApiPut({
    summary: 'Update an assignment',
    description: 'Update an existing assignment with the provided data',
    responseType: Assignment,
    bodyType: UpdateAssignmentDto,
    paramName: 'id',
    paramDescription: 'Assignment UUID',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    return await this.assignmentService.update(id, updateAssignmentDto);
  }

  @Patch(':id/close')
  @ApiPatch({
    summary: 'Close an assignment',
    description: 'Mark an assignment as completed and set return date',
    responseType: Assignment,
    paramName: 'id',
    paramDescription: 'Assignment UUID',
  })
  async close(@Param('id') id: string): Promise<Assignment> {
    return await this.assignmentService.closeAssignment(id);
  }

  @Delete(':id')
  @ApiDelete({
    summary: 'Delete an assignment',
    description: 'Delete an assignment by its ID',
    paramName: 'id',
    paramDescription: 'Assignment UUID',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.assignmentService.remove(id);
  }
}
