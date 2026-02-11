import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { AssetStatus } from '../../shared/enums';

export class UpdateStatusDto {
  @ApiProperty({ description: 'Asset status', enum: AssetStatus, example: AssetStatus.AVAILABLE })
  @IsNotEmpty()
  @IsEnum(AssetStatus)
  status!: AssetStatus;
}
