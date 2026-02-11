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
import { FrequencyUnit } from '../../shared/enums';

export class CreateMaintenanceDto {
  @IsNotEmpty()
  @IsUUID()
  assetId!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  frequencyAmount!: number;

  @IsNotEmpty()
  @IsEnum(FrequencyUnit)
  unit!: FrequencyUnit;

  @IsOptional()
  @IsDateString()
  lastServiceDate?: string;

  @IsOptional()
  @IsDateString()
  nextServiceDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceProvider?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMaintenanceDto {
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyAmount?: number;

  @IsOptional()
  @IsEnum(FrequencyUnit)
  unit?: FrequencyUnit;

  @IsOptional()
  @IsDateString()
  lastServiceDate?: string;

  @IsOptional()
  @IsDateString()
  nextServiceDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceProvider?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
