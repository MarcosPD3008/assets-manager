import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  items!: T[];

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total!: number;
}
