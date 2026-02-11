import { Entity, Column, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { AssetStatus } from '../shared/enums';
import { Assignment } from '../assignments/assignment.entity';
import { Maintenance } from '../maintenances/maintenance.entity';

@Entity('assets')
export class Asset extends BaseEntityWithTimestamps {
  @ApiProperty({ description: 'Asset name', example: 'Laptop Dell XPS 15' })
  @Column({ length: 255 })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Asset description', example: 'High-performance laptop for development' })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Serial number', example: 'SN123456789' })
  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Index({ unique: true, where: '"serialNumber" IS NOT NULL' })
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object', example: { color: 'black', weight: '2kg' } })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Asset status', enum: AssetStatus, example: AssetStatus.AVAILABLE })
  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.AVAILABLE,
  })
  @IsEnum(AssetStatus)
  status!: AssetStatus;

  @ApiPropertyOptional({ description: 'Asset category', example: 'Electronics' })
  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Asset location', example: 'Office A, Room 101' })
  @Column({ length: 255, nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Purchase date', example: '2024-01-15' })
  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  purchaseDate?: Date;

  @ApiPropertyOptional({ description: 'Purchase price', example: 1299.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Warranty expiry date', example: '2027-01-15' })
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
