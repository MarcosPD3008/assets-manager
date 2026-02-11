import { Entity, Column, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { Assignment } from '../assignments/assignment.entity';

@Entity('contacts')
export class Contact extends BaseEntityWithTimestamps {
  @ApiProperty({ description: 'Contact name', example: 'John Doe' })
  @Column({ length: 255 })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Contact email address', example: 'john.doe@example.com' })
  @Column({ length: 255 })
  @IsNotEmpty()
  @IsEmail()
  @Index({ unique: true })
  email!: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @Column({ length: 50, nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object', example: { emergencyContact: true } })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Department', example: 'IT' })
  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: 'Job position', example: 'Software Engineer' })
  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Prefers email communication' })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Related assignments', type: () => Assignment, isArray: true })
  @OneToMany(() => Assignment, (assignment) => assignment.assignee)
  assignments!: Assignment[];
}
