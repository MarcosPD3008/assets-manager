import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../../shared/enums';

export class CreateAssignmentDto {
  @ApiProperty({ description: 'Asset UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  assetId!: string;

  @ApiProperty({ description: 'Assignee (Contact) UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsNotEmpty()
  @IsUUID()
  assigneeId!: string;

  @ApiProperty({ description: 'Assignment start date in ISO format', example: '2024-01-15T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'Due date in ISO format', example: '2024-02-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Whether the assignment is permanent', default: false, example: false })
  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;

  @ApiPropertyOptional({ description: 'Assignment status', enum: AssignmentStatus, default: AssignmentStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Handle with care' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'UUID of user who created the assignment', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsOptional()
  @IsUUID()
  assignedBy?: string;
}

export class UpdateAssignmentDto {
  @ApiPropertyOptional({ description: 'Asset UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Assignee (Contact) UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Assignment start date in ISO format', example: '2024-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Due date in ISO format', example: '2024-02-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Return date in ISO format', example: '2024-02-14T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @ApiPropertyOptional({ description: 'Whether the assignment is permanent', example: false })
  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;

  @ApiPropertyOptional({ description: 'Assignment status', enum: AssignmentStatus })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Handle with care' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'UUID of user who created the assignment', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsOptional()
  @IsUUID()
  assignedBy?: string;
}
