import { IsNotEmpty, IsDateString } from 'class-validator';

export class CalendarQueryDto {
  @IsNotEmpty()
  @IsDateString()
  date!: string; // Formato ISO: YYYY-MM-DD o YYYY-MM
}
