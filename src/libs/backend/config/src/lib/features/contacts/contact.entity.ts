import { Entity, Column, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { Assignment } from '../assignments/assignment.entity';
import { ExportColumn, ExportEntity } from '../shared/decorators/export.decorator';

@Entity('contacts')
@ExportEntity({ fileName: 'contacts', title: 'Contactos' })
export class Contact extends BaseEntityWithTimestamps {
  @ApiProperty({ description: 'Contact name', example: 'John Doe' })
  @ExportColumn({ label: 'Nombre', order: 1 })
  @Column({ length: 255 })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Contact email address', example: 'john.doe@example.com' })
  @ExportColumn({ label: 'Correo', order: 2 })
  @Column({ length: 255 })
  @IsNotEmpty()
  @IsEmail()
  @Index({ unique: true })
  email!: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @ExportColumn({ label: 'Telefono', order: 3 })
  @Column({ length: 50, nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object', example: { emergencyContact: true } })
  @ExportColumn({ label: 'Metadatos', order: 7, formatter: 'json' })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Department', example: 'IT' })
  @ExportColumn({ label: 'Departamento', order: 4 })
  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: 'Job position', example: 'Software Engineer' })
  @ExportColumn({ label: 'Cargo', order: 5 })
  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Prefers email communication' })
  @ExportColumn({ label: 'Notas', order: 6 })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Related assignments', type: () => Assignment, isArray: true })
  @OneToMany(() => Assignment, (assignment) => assignment.assignee)
  assignments!: Assignment[];
}
