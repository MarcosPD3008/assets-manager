import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ReminderType,
  Priority,
  Channel,
  TargetType,
  ReminderSourceType,
  ReminderStatus,
} from '../../shared/enums';

export class CreateReminderDto {
  @ApiProperty({ description: 'Reminder message', example: 'Asset maintenance due in 3 days' })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiProperty({ description: 'Scheduled date in ISO format', example: '2024-01-20T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  scheduledDate!: string;

  @ApiProperty({ description: 'Reminder type', enum: ReminderType, example: ReminderType.MAINTENANCE })
  @IsNotEmpty()
  @IsEnum(ReminderType)
  type!: ReminderType;

  @ApiProperty({ description: 'Target type', enum: TargetType, example: TargetType.SYSTEM })
  @IsNotEmpty()
  @IsEnum(TargetType)
  targetType!: TargetType;

  @ApiProperty({ description: 'Target UUID (contact or system)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  targetId!: string;

  @ApiPropertyOptional({ description: 'Reminder priority', enum: Priority, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Notification channel', enum: Channel, default: Channel.IN_APP })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @ApiPropertyOptional({ description: 'Related assignment UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({ description: 'Related maintenance UUID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsOptional()
  @IsUUID()
  maintenanceId?: string;

  @ApiPropertyOptional({
    description: 'Source type',
    enum: ReminderSourceType,
    default: ReminderSourceType.MANUAL,
  })
  @IsOptional()
  @IsEnum(ReminderSourceType)
  sourceType?: ReminderSourceType;

  @ApiPropertyOptional({
    description: 'Status',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;
}

export class UpdateReminderDto {
  @ApiPropertyOptional({ description: 'Reminder message', example: 'Asset maintenance due in 3 days' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Scheduled date in ISO format', example: '2024-01-20T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Reminder type', enum: ReminderType })
  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @ApiPropertyOptional({ description: 'Target type', enum: TargetType })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional({ description: 'Target UUID (contact or system)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Reminder priority', enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Notification channel', enum: Channel })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @ApiPropertyOptional({ description: 'Related assignment UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({ description: 'Related maintenance UUID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsOptional()
  @IsUUID()
  maintenanceId?: string;

  @ApiPropertyOptional({ description: 'Source type', enum: ReminderSourceType })
  @IsOptional()
  @IsEnum(ReminderSourceType)
  sourceType?: ReminderSourceType;

  @ApiPropertyOptional({ description: 'Status', enum: ReminderStatus })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;
}
