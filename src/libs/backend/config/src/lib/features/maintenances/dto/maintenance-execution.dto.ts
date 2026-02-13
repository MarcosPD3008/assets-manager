import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteMaintenanceDto {
  @ApiPropertyOptional({ description: 'Execution date in ISO format', example: '2026-02-12T15:00:00Z' })
  @IsOptional()
  @IsDateString()
  executedAt?: string;

  @ApiPropertyOptional({ description: 'Real execution cost', example: 120.25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ description: 'Service provider used', example: 'Servicios Integrales Ltda' })
  @IsOptional()
  @IsString()
  serviceProvider?: string;

  @ApiPropertyOptional({ description: 'Execution notes', example: 'Se realizo limpieza y cambio de pasta termica.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'UUID of operator', example: '123e4567-e89b-12d3-a456-426614174111' })
  @IsOptional()
  @IsUUID()
  performedBy?: string;
}
