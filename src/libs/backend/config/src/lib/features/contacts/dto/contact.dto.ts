import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ description: 'Contact name', minLength: 1, maxLength: 255, example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Contact email address', maxLength: 255, example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 50, example: '+1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object', example: { emergencyContact: true } })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Department', maxLength: 100, example: 'IT' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: 'Job position', maxLength: 100, example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Prefers email communication' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContactDto {
  @ApiPropertyOptional({ description: 'Contact name', minLength: 1, maxLength: 255, example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Contact email address', maxLength: 255, example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 50, example: '+1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object', example: { emergencyContact: true } })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Department', maxLength: 100, example: 'IT' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: 'Job position', maxLength: 100, example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Prefers email communication' })
  @IsOptional()
  @IsString()
  notes?: string;
}
