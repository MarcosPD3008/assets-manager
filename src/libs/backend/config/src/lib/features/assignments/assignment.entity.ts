import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { AssignmentStatus } from '../shared/enums';
import { Asset } from '../assets/asset.entity';
import { Contact } from '../contacts/contact.entity';
import { Reminder } from '../reminders/reminder.entity';

@Entity('assignments')
export class Assignment extends BaseEntityWithTimestamps {
  @ApiPropertyOptional({ description: 'Assigned asset', type: () => Asset })
  @ManyToOne(() => Asset, (asset) => asset.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  @IsNotEmpty()
  asset!: Asset;

  @ApiProperty({ description: 'Asset UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ name: 'assetId' })
  @IsNotEmpty()
  @IsUUID()
  assetId!: string;

  @ApiPropertyOptional({ description: 'Assignee (Contact)', type: () => Contact })
  @ManyToOne(() => Contact, (contact) => contact.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assigneeId' })
  @IsNotEmpty()
  assignee!: Contact;

  @ApiProperty({ description: 'Assignee (Contact) UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column({ name: 'assigneeId' })
  @IsNotEmpty()
  @IsUUID()
  assigneeId!: string;

  @ApiProperty({ description: 'Assignment start date', example: '2024-01-15T00:00:00Z' })
  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  @IsDateString()
  startDate!: Date;

  @ApiPropertyOptional({ description: 'Due date', example: '2024-02-15T00:00:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Return date', example: '2024-02-14T00:00:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  returnDate?: Date;

  @ApiProperty({ description: 'Whether the assignment is permanent', default: false, example: false })
  @Column({ default: false })
  @IsBoolean()
  isPermanent!: boolean;

  @ApiProperty({ description: 'Assignment status', enum: AssignmentStatus, example: AssignmentStatus.ACTIVE })
  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  @IsEnum(AssignmentStatus)
  status!: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Handle with care' })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'UUID of user who created the assignment', example: '123e4567-e89b-12d3-a456-426614174002' })
  @Column({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedBy?: string;

  @ApiPropertyOptional({ description: 'Related reminders', type: () => Reminder, isArray: true })
  @OneToMany(() => Reminder, (reminder) => reminder.assignment)
  reminders!: Reminder[];

  closeAssignment(): void {
    this.status = AssignmentStatus.COMPLETED;
    if (!this.returnDate) {
      this.returnDate = new Date();
    }
  }
}
