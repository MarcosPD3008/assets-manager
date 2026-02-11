import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsUUID,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FrequencyUnit } from '../../shared/enums';

export class CreateMaintenanceDto {
  @ApiProperty({ description: 'Asset UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  assetId!: string;

  @ApiProperty({ description: 'Maintenance description', example: 'Regular cleaning and inspection' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Frequency amount', minimum: 1, example: 3 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  frequencyAmount!: number;

  @ApiProperty({ description: 'Frequency unit', enum: FrequencyUnit, example: FrequencyUnit.MONTH })
  @IsNotEmpty()
  @IsEnum(FrequencyUnit)
  unit!: FrequencyUnit;

  @ApiPropertyOptional({ description: 'Last service date in ISO format', example: '2024-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  lastServiceDate?: string;

  @ApiPropertyOptional({ description: 'Next service date in ISO format', example: '2024-04-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  nextServiceDate?: string;

  @ApiPropertyOptional({ description: 'Service cost', minimum: 0, example: 150.50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ description: 'Service provider name', maxLength: 255, example: 'Tech Services Inc.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceProvider?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Check battery health' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMaintenanceDto {
  @ApiPropertyOptional({ description: 'Asset UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Maintenance description', example: 'Regular cleaning and inspection' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Frequency amount', minimum: 1, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyAmount?: number;

  @ApiPropertyOptional({ description: 'Frequency unit', enum: FrequencyUnit, example: FrequencyUnit.MONTH })
  @IsOptional()
  @IsEnum(FrequencyUnit)
  unit?: FrequencyUnit;

  @ApiPropertyOptional({ description: 'Last service date in ISO format', example: '2024-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  lastServiceDate?: string;

  @ApiPropertyOptional({ description: 'Next service date in ISO format', example: '2024-04-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  nextServiceDate?: string;

  @ApiPropertyOptional({ description: 'Service cost', minimum: 0, example: 150.50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ description: 'Service provider name', maxLength: 255, example: 'Tech Services Inc.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceProvider?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Check battery health' })
  @IsOptional()
  @IsString()
  notes?: string;
}
