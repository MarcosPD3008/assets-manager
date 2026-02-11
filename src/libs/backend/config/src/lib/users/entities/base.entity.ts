import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export abstract class BaseEntityWithTimestamps extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Exclude({ toPlainOnly: true })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  @Exclude({ toPlainOnly: true })
  updatedAt!: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  deletedAt?: Date;
}

