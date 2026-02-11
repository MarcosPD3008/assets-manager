import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus } from '../../shared/enums';

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset name', minLength: 1, maxLength: 255, example: 'Laptop Dell XPS 15' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Asset description', example: 'High-performance laptop for development' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Serial number', maxLength: 100, example: 'SN123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object', example: { color: 'black', weight: '2kg' } })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Asset status', enum: AssetStatus, default: AssetStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Asset category', maxLength: 100, example: 'Electronics' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Asset location', maxLength: 255, example: 'Office A, Room 101' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Purchase date in ISO format', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Purchase price', minimum: 0, example: 1299.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Warranty expiry date in ISO format', example: '2027-01-15' })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;
}

export class UpdateAssetDto {
  @ApiPropertyOptional({ description: 'Asset name', minLength: 1, maxLength: 255, example: 'Laptop Dell XPS 15' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Asset description', example: 'High-performance laptop for development' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Serial number', maxLength: 100, example: 'SN123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object', example: { color: 'black', weight: '2kg' } })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Asset status', enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Asset category', maxLength: 100, example: 'Electronics' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Asset location', maxLength: 255, example: 'Office A, Room 101' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Purchase date in ISO format', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Purchase price', minimum: 0, example: 1299.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Warranty expiry date in ISO format', example: '2027-01-15' })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;
}

export * from './update-status.dto';
