import { Entity, Column, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { AssetStatus } from '../shared/enums';
import { Assignment } from '../assignments/assignment.entity';
import { Maintenance } from '../maintenances/maintenance.entity';

@Entity('assets')
export class Asset extends BaseEntityWithTimestamps {
  @Column({ length: 255 })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Index({ unique: true, where: '"serialNumber" IS NOT NULL' })
  serialNumber?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.AVAILABLE,
  })
  @IsEnum(AssetStatus)
  status!: AssetStatus;

  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Column({ length: 255, nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  purchaseDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  purchasePrice?: number;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: Date;

  @OneToMany(() => Assignment, (assignment) => assignment.asset)
  assignments!: Assignment[];

  @OneToMany(() => Maintenance, (maintenance) => maintenance.asset)
  maintenances!: Maintenance[];

  updateStatus(newStatus: AssetStatus): void {
    this.status = newStatus;
  }
}
