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
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { FrequencyUnit } from '../shared/enums';
import { Asset } from '../assets/asset.entity';
import { Reminder } from '../reminders/reminder.entity';

@Entity('maintenances')
export class Maintenance extends BaseEntityWithTimestamps {
  @ManyToOne(() => Asset, (asset) => asset.maintenances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assetId' })
  @IsNotEmpty()
  asset!: Asset;

  @Column({ name: 'assetId' })
  @IsNotEmpty()
  @IsUUID()
  assetId!: string;

  @Column({ type: 'text' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @Column({ type: 'int' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  frequencyAmount!: number;

  @Column({
    type: 'enum',
    enum: FrequencyUnit,
  })
  @IsEnum(FrequencyUnit)
  unit!: FrequencyUnit;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  lastServiceDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  nextServiceDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @Column({ length: 255, nullable: true })
  @IsOptional()
  @IsString()
  serviceProvider?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @OneToMany(() => Reminder, (reminder) => reminder.maintenance)
  reminders!: Reminder[];

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
