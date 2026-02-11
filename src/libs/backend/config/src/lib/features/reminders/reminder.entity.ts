import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { ReminderType, Priority, Channel, TargetType } from '../shared/enums';
import { Assignment } from '../assignments/assignment.entity';
import { Maintenance } from '../maintenances/maintenance.entity';

@Entity('reminders')
@Index(['targetType', 'targetId'])
export class Reminder extends BaseEntityWithTimestamps {
  @ApiProperty({ description: 'Reminder message', example: 'Asset maintenance due in 3 days' })
  @Column({ type: 'text' })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiProperty({ description: 'Scheduled date', example: '2024-01-20T00:00:00Z' })
  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  @IsDateString()
  scheduledDate!: Date;

  @ApiProperty({ description: 'Whether the reminder has been sent', default: false, example: false })
  @Column({ default: false })
  @IsBoolean()
  isSent!: boolean;

  @ApiProperty({ description: 'Reminder type', enum: ReminderType, example: ReminderType.MAINTENANCE })
  @Column({
    type: 'enum',
    enum: ReminderType,
  })
  @IsEnum(ReminderType)
  type!: ReminderType;

  @ApiProperty({ description: 'Target type', enum: TargetType, default: TargetType.SYSTEM, example: TargetType.SYSTEM })
  @Column({
    type: 'enum',
    enum: TargetType,
    default: TargetType.SYSTEM,
  })
  @IsEnum(TargetType)
  targetType!: TargetType;

  @ApiProperty({ description: 'Target UUID (contact or system)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column()
  @IsNotEmpty()
  @IsUUID()
  targetId!: string;

  @ApiProperty({ description: 'Reminder priority', enum: Priority, default: Priority.MEDIUM, example: Priority.MEDIUM })
  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  @IsEnum(Priority)
  priority!: Priority;

  @ApiProperty({ description: 'Notification channel', enum: Channel, default: Channel.EMAIL, example: Channel.EMAIL })
  @Column({
    type: 'enum',
    enum: Channel,
    default: Channel.EMAIL,
  })
  @IsEnum(Channel)
  channel!: Channel;

  @ApiPropertyOptional({ description: 'Related assignment', type: () => Assignment })
  @ManyToOne(() => Assignment, (assignment) => assignment.reminders, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assignmentId' })
  @IsOptional()
  assignment?: Assignment;

  @ApiPropertyOptional({ description: 'Assignment UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column({ name: 'assignmentId', nullable: true })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({ description: 'Related maintenance', type: () => Maintenance })
  @ManyToOne(() => Maintenance, (maintenance) => maintenance.reminders, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'maintenanceId' })
  @IsOptional()
  maintenance?: Maintenance;

  @ApiPropertyOptional({ description: 'Maintenance UUID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @Column({ name: 'maintenanceId', nullable: true })
  @IsOptional()
  @IsUUID()
  maintenanceId?: string;
}
