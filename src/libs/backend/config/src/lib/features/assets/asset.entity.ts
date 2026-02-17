import { Entity, Column, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { AssetStatus, AssetStatusLabels } from '../shared/enums';
import { Assignment } from '../assignments/assignment.entity';
import { Maintenance } from '../maintenances/maintenance.entity';
import { ExportColumn, ExportEntity } from '../shared/decorators/export.decorator';

@Entity('assets')
@ExportEntity({ fileName: 'assets', title: 'Activos' })
export class Asset extends BaseEntityWithTimestamps {
  @ApiProperty({ description: 'Asset name', example: 'Laptop Dell XPS 15' })
  @ExportColumn({ label: 'Nombre', order: 1 })
  @Column({ length: 255 })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Asset description', example: 'High-performance laptop for development' })
  @ExportColumn({ label: 'Descripcion', order: 2 })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Serial number', example: 'SN123456789' })
  @ExportColumn({ label: 'Numero de serie', order: 3 })
  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Index({ unique: true, where: '"serialNumber" IS NOT NULL' })
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object', example: { color: 'black', weight: '2kg' } })
  @ExportColumn({ label: 'Metadatos', order: 9, formatter: 'json' })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Asset status', enum: AssetStatus, example: AssetStatus.AVAILABLE })
  @ExportColumn({ label: 'Estado', order: 4, enumLabels: AssetStatusLabels })
  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.AVAILABLE,
  })
  @IsEnum(AssetStatus)
  status!: AssetStatus;

  @ApiPropertyOptional({ description: 'Asset category', example: 'Electronics' })
  @ExportColumn({ label: 'Categoria', order: 5 })
  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Asset location', example: 'Office A, Room 101' })
  @ExportColumn({ label: 'Ubicacion', order: 6 })
  @Column({ length: 255, nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Purchase date', example: '2024-01-15' })
  @ExportColumn({ label: 'Fecha de compra', order: 7, formatter: 'date' })
  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  purchaseDate?: Date;

  @ApiPropertyOptional({ description: 'Purchase price', example: 1299.99 })
  @ExportColumn({ label: 'Precio de compra', order: 8 })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Warranty expiry date', example: '2027-01-15' })
  @ExportColumn({ label: 'Vencimiento de garantia', order: 10, formatter: 'date' })
  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: Date;

  @ApiPropertyOptional({ description: 'Related assignments', type: () => Assignment, isArray: true })
  @OneToMany(() => Assignment, (assignment) => assignment.asset)
  assignments!: Assignment[];

  @ApiPropertyOptional({ description: 'Related maintenances', type: () => Maintenance, isArray: true })
  @OneToMany(() => Maintenance, (maintenance) => maintenance.asset)
  maintenances!: Maintenance[];

  updateStatus(newStatus: AssetStatus): void {
    this.status = newStatus;
  }
}
