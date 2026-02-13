import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { Channel, NotificationDeliveryStatus } from '../shared/enums';
import { Reminder } from './reminder.entity';

@Entity('reminder_deliveries')
@Index('IDX_REMINDER_DELIVERIES_STATUS_CHANNEL_QUEUED_AT', ['status', 'channel', 'queuedAt'])
@Index('IDX_REMINDER_DELIVERIES_REMINDER_ID', ['reminderId'])
@Index('IDX_REMINDER_DELIVERIES_IDEMPOTENCY_KEY', ['idempotencyKey'], { unique: true })
export class ReminderDelivery extends BaseEntityWithTimestamps {
  @ApiProperty({ description: 'Reminder UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ name: 'reminderId' })
  @IsUUID()
  reminderId!: string;

  @ApiProperty({ description: 'Channel used for notification delivery', enum: Channel })
  @Column({
    type: 'enum',
    enum: Channel,
  })
  @IsEnum(Channel)
  channel!: Channel;

  @ApiProperty({
    description: 'Delivery status',
    enum: NotificationDeliveryStatus,
    default: NotificationDeliveryStatus.QUEUED,
  })
  @Column({
    type: 'enum',
    enum: NotificationDeliveryStatus,
    default: NotificationDeliveryStatus.QUEUED,
  })
  @IsEnum(NotificationDeliveryStatus)
  status!: NotificationDeliveryStatus;

  @ApiProperty({ description: 'Current attempts count', example: 0 })
  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  attempts!: number;

  @ApiProperty({ description: 'Max attempts allowed', example: 5 })
  @Column({ type: 'int', default: 5 })
  @IsInt()
  @Min(1)
  maxAttempts!: number;

  @ApiPropertyOptional({ description: 'Queue job ID', example: '5a620abf-2f7d-4e45-b64b-9a9e5a8f0f45' })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiProperty({ description: 'Idempotency key', example: 'reminder-id:IN_APP' })
  @Column()
  @IsString()
  idempotencyKey!: string;

  @ApiPropertyOptional({ description: 'Date when delivery entered queue' })
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  queuedAt?: Date;

  @ApiPropertyOptional({ description: 'Date when delivery started processing' })
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  processedAt?: Date;

  @ApiPropertyOptional({ description: 'Date when delivery was sent' })
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  sentAt?: Date;

  @ApiPropertyOptional({ description: 'Date when delivery moved to dead letter' })
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  deadLetterAt?: Date;

  @ApiPropertyOptional({ description: 'Last processing error message' })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  lastError?: string;

  @ApiPropertyOptional({ description: 'Provider message ID when available' })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  providerMessageId?: string;

  @ApiPropertyOptional({ description: 'Payload snapshot used to send the notification' })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Related reminder', type: () => Reminder })
  @ManyToOne(() => Reminder, (reminder) => reminder.deliveries, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reminderId' })
  reminder!: Reminder;
}
