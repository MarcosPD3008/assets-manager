import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { IsOptional, IsString, IsUUID, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { Maintenance } from './maintenance.entity';

@Entity('maintenance_executions')
export class MaintenanceExecution extends BaseEntityWithTimestamps {
  @ApiPropertyOptional({ description: 'Related maintenance', type: () => Maintenance })
  @ManyToOne(() => Maintenance, (maintenance) => maintenance.executions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'maintenanceId' })
  maintenance!: Maintenance;

  @ApiProperty({ description: 'Maintenance UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ name: 'maintenanceId' })
  @IsUUID()
  maintenanceId!: string;

  @ApiProperty({ description: 'Execution date', example: '2026-02-12T10:30:00Z' })
  @Column({ type: 'timestamp' })
  @IsDateString()
  executedAt!: Date;

  @ApiPropertyOptional({ description: 'Real service cost', example: 80.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ description: 'Service provider', example: 'Servicio Tecnico SAS' })
  @Column({ length: 255, nullable: true })
  @IsOptional()
  @IsString()
  serviceProvider?: string;

  @ApiPropertyOptional({ description: 'Execution notes', example: 'Cambio de filtros y limpieza interna.' })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Operator UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column({ nullable: true })
  @IsOptional()
  @IsUUID()
  performedBy?: string;
}
