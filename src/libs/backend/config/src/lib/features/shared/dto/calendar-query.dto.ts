import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CalendarQueryDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}(-\d{2})?$/, {
    message: 'date must be in YYYY-MM or YYYY-MM-DD format',
  })
  date!: string; // Formato ISO: YYYY-MM-DD o YYYY-MM
}
