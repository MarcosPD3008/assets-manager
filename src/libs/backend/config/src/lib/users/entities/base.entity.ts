import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export abstract class BaseEntityWithTimestamps extends BaseEntity {
  @ApiProperty({ description: 'Unique identifier (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({ description: 'Creation timestamp', example: '2024-01-15T10:30:00Z' })
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Exclude({ toPlainOnly: true })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Last update timestamp', example: '2024-01-15T10:30:00Z' })
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  @Exclude({ toPlainOnly: true })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Soft delete timestamp', example: '2024-01-15T10:30:00Z' })
  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  deletedAt?: Date;
}

