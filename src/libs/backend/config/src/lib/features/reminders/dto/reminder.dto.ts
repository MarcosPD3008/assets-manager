import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ReminderType, Priority, Channel, TargetType } from '../../shared/enums';

export class CreateReminderDto {
  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledDate!: string;

  @IsNotEmpty()
  @IsEnum(ReminderType)
  type!: ReminderType;

  @IsNotEmpty()
  @IsEnum(TargetType)
  targetType!: TargetType;

  @IsNotEmpty()
  @IsUUID()
  targetId!: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @IsOptional()
  @IsUUID()
  maintenanceId?: string;
}

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @IsOptional()
  @IsUUID()
  maintenanceId?: string;
}
