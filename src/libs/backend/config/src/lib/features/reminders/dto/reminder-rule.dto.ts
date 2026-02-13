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
import {
  Channel,
  Priority,
  ReminderOffsetUnit,
  TargetEntityType,
  TargetType,
} from '../../shared/enums';

export class CreateReminderRuleDto {
  @ApiProperty({ description: 'Target entity type', enum: TargetEntityType })
  @IsEnum(TargetEntityType)
  targetEntityType!: TargetEntityType;

  @ApiProperty({ description: 'Target entity UUID' })
  @IsUUID()
  targetEntityId!: string;

  @ApiProperty({ description: 'Offset value before due date', example: 7, minimum: 1 })
  @IsInt()
  @Min(1)
  offsetValue!: number;

  @ApiProperty({ description: 'Offset unit', enum: ReminderOffsetUnit, example: ReminderOffsetUnit.DAY })
  @IsEnum(ReminderOffsetUnit)
  offsetUnit!: ReminderOffsetUnit;

  @ApiPropertyOptional({ description: 'Recipient type', enum: TargetType, default: TargetType.SYSTEM })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional({ description: 'Priority', enum: Priority, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Channel', enum: Channel, default: Channel.IN_APP })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @ApiPropertyOptional({ description: 'Custom message template' })
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @ApiPropertyOptional({ description: 'Whether rule is active', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateReminderRuleDto {
  @ApiPropertyOptional({ description: 'Offset value before due date', example: 7, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  offsetValue?: number;

  @ApiPropertyOptional({ description: 'Offset unit', enum: ReminderOffsetUnit })
  @IsOptional()
  @IsEnum(ReminderOffsetUnit)
  offsetUnit?: ReminderOffsetUnit;

  @ApiPropertyOptional({ description: 'Recipient type', enum: TargetType })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional({ description: 'Priority', enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Channel', enum: Channel })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @ApiPropertyOptional({ description: 'Custom message template' })
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @ApiPropertyOptional({ description: 'Whether rule is active' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
