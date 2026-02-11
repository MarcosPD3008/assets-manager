import { Entity, Column, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { Assignment } from '../assignments/assignment.entity';

@Entity('contacts')
export class Contact extends BaseEntityWithTimestamps {
  @Column({ length: 255 })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Column({ length: 255 })
  @IsNotEmpty()
  @IsEmail()
  @Index({ unique: true })
  email!: string;

  @Column({ length: 50, nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @OneToMany(() => Assignment, (assignment) => assignment.assignee)
  assignments!: Assignment[];
}
