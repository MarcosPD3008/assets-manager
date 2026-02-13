import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { FrequencyUnit } from '../shared/enums';
import { Asset } from '../assets/asset.entity';
import { Reminder } from '../reminders/reminder.entity';
import { MaintenanceExecution } from './maintenance-execution.entity';

@Entity('maintenances')
export class Maintenance extends BaseEntityWithTimestamps {
  @ApiPropertyOptional({ description: 'Related asset', type: () => Asset })
  @ManyToOne(() => Asset, (asset) => asset.maintenances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assetId' })
  @IsNotEmpty()
  asset!: Asset;

  @ApiProperty({ description: 'Asset UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ name: 'assetId' })
  @IsNotEmpty()
  @IsUUID()
  assetId!: string;

  @ApiProperty({ description: 'Maintenance description', example: 'Regular cleaning and inspection' })
  @Column({ type: 'text' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Frequency amount', minimum: 1, example: 3 })
  @Column({ type: 'int' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  frequencyAmount!: number;

  @ApiProperty({ description: 'Frequency unit', enum: FrequencyUnit, example: FrequencyUnit.MONTH })
  @Column({
    type: 'enum',
    enum: FrequencyUnit,
  })
  @IsEnum(FrequencyUnit)
  unit!: FrequencyUnit;

  @ApiPropertyOptional({ description: 'Last service date', example: '2024-01-15T00:00:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  lastServiceDate?: Date;

  @ApiPropertyOptional({ description: 'Next service date', example: '2024-04-15T00:00:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  nextServiceDate?: Date;

  @ApiPropertyOptional({ description: 'Service cost', example: 150.50 })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional({ description: 'Service provider name', example: 'Tech Services Inc.' })
  @Column({ length: 255, nullable: true })
  @IsOptional()
  @IsString()
  serviceProvider?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Check battery health' })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Related reminders', type: () => Reminder, isArray: true })
  @OneToMany(() => Reminder, (reminder) => reminder.maintenance)
  reminders!: Reminder[];

  @ApiPropertyOptional({ description: 'Execution history', type: () => MaintenanceExecution, isArray: true })
  @OneToMany(() => MaintenanceExecution, (execution) => execution.maintenance)
  executions!: MaintenanceExecution[];

  calculateNextDate(): Date {
    if (!this.lastServiceDate) {
      return new Date();
    }

    const nextDate = new Date(this.lastServiceDate);
    const amount = this.frequencyAmount;

    switch (this.unit) {
      case FrequencyUnit.DAY:
        nextDate.setDate(nextDate.getDate() + amount);
        break;
      case FrequencyUnit.WEEK:
        nextDate.setDate(nextDate.getDate() + amount * 7);
        break;
      case FrequencyUnit.MONTH:
        nextDate.setMonth(nextDate.getMonth() + amount);
        break;
      case FrequencyUnit.YEAR:
        nextDate.setFullYear(nextDate.getFullYear() + amount);
        break;
    }

    return nextDate;
  }
}
