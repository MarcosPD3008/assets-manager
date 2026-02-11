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
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { ReminderType, Priority, Channel, TargetType } from '../shared/enums';
import { Assignment } from '../assignments/assignment.entity';
import { Maintenance } from '../maintenances/maintenance.entity';

@Entity('reminders')
@Index(['targetType', 'targetId'])
export class Reminder extends BaseEntityWithTimestamps {
  @Column({ type: 'text' })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  @IsDateString()
  scheduledDate!: Date;

  @Column({ default: false })
  @IsBoolean()
  isSent!: boolean;

  @Column({
    type: 'enum',
    enum: ReminderType,
  })
  @IsEnum(ReminderType)
  type!: ReminderType;

  @Column({
    type: 'enum',
    enum: TargetType,
    default: TargetType.SYSTEM,
  })
  @IsEnum(TargetType)
  targetType!: TargetType;

  @Column()
  @IsNotEmpty()
  @IsUUID()
  targetId!: string;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  @IsEnum(Priority)
  priority!: Priority;

  @Column({
    type: 'enum',
    enum: Channel,
    default: Channel.EMAIL,
  })
  @IsEnum(Channel)
  channel!: Channel;

  @ManyToOne(() => Assignment, (assignment) => assignment.reminders, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assignmentId' })
  @IsOptional()
  assignment?: Assignment;

  @Column({ name: 'assignmentId', nullable: true })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ManyToOne(() => Maintenance, (maintenance) => maintenance.reminders, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'maintenanceId' })
  @IsOptional()
  maintenance?: Maintenance;

  @Column({ name: 'maintenanceId', nullable: true })
  @IsOptional()
  @IsUUID()
  maintenanceId?: string;
}
