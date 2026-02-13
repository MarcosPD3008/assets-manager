import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import {
  ReminderType,
  Priority,
  Channel,
  TargetType,
  ReminderStatus,
  ReminderSourceType,
} from '../shared/enums';
import { Assignment } from '../assignments/assignment.entity';
import { Maintenance } from '../maintenances/maintenance.entity';
import { ReminderRule } from './reminder-rule.entity';
import { ReminderDelivery } from './reminder-delivery.entity';

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

  @ApiProperty({
    description: 'Reminder status',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
    example: ReminderStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  @IsEnum(ReminderStatus)
  status!: ReminderStatus;

  @ApiProperty({
    description: 'Reminder source type',
    enum: ReminderSourceType,
    default: ReminderSourceType.MANUAL,
    example: ReminderSourceType.MANUAL,
  })
  @Column({
    type: 'enum',
    enum: ReminderSourceType,
    default: ReminderSourceType.MANUAL,
  })
  @IsEnum(ReminderSourceType)
  sourceType!: ReminderSourceType;

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

  @ApiProperty({ description: 'Notification channel', enum: Channel, default: Channel.IN_APP, example: Channel.IN_APP })
  @Column({
    type: 'enum',
    enum: Channel,
    default: Channel.IN_APP,
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

  @ApiPropertyOptional({ description: 'Rule that generated this reminder', type: () => ReminderRule })
  @ManyToOne(() => ReminderRule, (rule) => rule.generatedReminders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reminderRuleId' })
  @IsOptional()
  reminderRule?: ReminderRule;

  @ApiPropertyOptional({
    description: 'Reminder rule UUID when generated from a rule',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @Column({ name: 'reminderRuleId', nullable: true })
  @IsOptional()
  @IsUUID()
  reminderRuleId?: string;

  @ApiPropertyOptional({
    description: 'Delivery attempts for this reminder',
    type: () => ReminderDelivery,
    isArray: true,
  })
  @OneToMany(() => ReminderDelivery, (delivery) => delivery.reminder)
  deliveries?: ReminderDelivery[];

  // Legacy compatibility for frontend while migrating from isSent to status.
  get isSent(): boolean {
    return this.status === ReminderStatus.SENT;
  }
}
