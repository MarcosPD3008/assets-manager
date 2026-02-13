import { Entity, Column, OneToMany, Index } from 'typeorm';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import {
  Channel,
  Priority,
  ReminderOffsetUnit,
  TargetEntityType,
  TargetType,
} from '../shared/enums';
import { Reminder } from './reminder.entity';

@Entity('reminder_rules')
@Index(['targetEntityType', 'targetEntityId'])
export class ReminderRule extends BaseEntityWithTimestamps {
  @ApiProperty({
    description: 'Rule target entity type',
    enum: TargetEntityType,
    example: TargetEntityType.MAINTENANCE,
  })
  @Column({
    type: 'enum',
    enum: TargetEntityType,
  })
  @IsEnum(TargetEntityType)
  targetEntityType!: TargetEntityType;

  @ApiProperty({
    description: 'Rule target entity UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column()
  @IsUUID()
  targetEntityId!: string;

  @ApiProperty({ description: 'Offset amount', minimum: 1, example: 7 })
  @Column({ type: 'int' })
  @IsInt()
  @Min(1)
  offsetValue!: number;

  @ApiProperty({
    description: 'Offset unit',
    enum: ReminderOffsetUnit,
    example: ReminderOffsetUnit.DAY,
  })
  @Column({
    type: 'enum',
    enum: ReminderOffsetUnit,
  })
  @IsEnum(ReminderOffsetUnit)
  offsetUnit!: ReminderOffsetUnit;

  @ApiProperty({
    description: 'Target recipient type',
    enum: TargetType,
    example: TargetType.SYSTEM,
  })
  @Column({
    type: 'enum',
    enum: TargetType,
    default: TargetType.SYSTEM,
  })
  @IsEnum(TargetType)
  targetType!: TargetType;

  @ApiPropertyOptional({ description: 'Rule priority', enum: Priority })
  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  @IsEnum(Priority)
  priority!: Priority;

  @ApiPropertyOptional({ description: 'Notification channel', enum: Channel })
  @Column({
    type: 'enum',
    enum: Channel,
    default: Channel.IN_APP,
  })
  @IsEnum(Channel)
  channel!: Channel;

  @ApiPropertyOptional({
    description: 'Custom message template',
    example: 'Recordatorio automatico: mantenimiento cercano.',
  })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @ApiPropertyOptional({ description: 'Whether rule is active', default: true })
  @Column({ default: true })
  @IsBoolean()
  active!: boolean;

  @ApiPropertyOptional({ description: 'Generated reminders', type: () => Reminder, isArray: true })
  @OneToMany(() => Reminder, (reminder) => reminder.reminderRule)
  generatedReminders!: Reminder[];
}
