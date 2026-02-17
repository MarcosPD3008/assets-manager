import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkImportRowDto {
  @ApiProperty({ description: 'Original row number from Excel file', example: 2 })
  @IsInt()
  @Min(2)
  rowNumber!: number;

  @ApiProperty({
    description: 'Mapped row data by entity property',
    example: { name: 'John Doe', email: 'john@company.com' },
  })
  @IsObject()
  data!: Record<string, unknown>;
}

export class ValidateBulkImportDto {
  @ApiProperty({ type: BulkImportRowDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportRowDto)
  rows!: BulkImportRowDto[];
}

export class CommitBulkImportDto {
  @ApiProperty({ type: BulkImportRowDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportRowDto)
  rows!: BulkImportRowDto[];
}
