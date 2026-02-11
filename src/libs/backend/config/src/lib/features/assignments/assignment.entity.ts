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
import { BaseEntityWithTimestamps } from '../../users/entities/base.entity';
import { AssignmentStatus } from '../shared/enums';
import { Asset } from '../assets/asset.entity';
import { Contact } from '../contacts/contact.entity';
import { Reminder } from '../reminders/reminder.entity';

@Entity('assignments')
export class Assignment extends BaseEntityWithTimestamps {
  @ManyToOne(() => Asset, (asset) => asset.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  @IsNotEmpty()
  asset!: Asset;

  @Column({ name: 'assetId' })
  @IsNotEmpty()
  @IsUUID()
  assetId!: string;

  @ManyToOne(() => Contact, (contact) => contact.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assigneeId' })
  @IsNotEmpty()
  assignee!: Contact;

  @Column({ name: 'assigneeId' })
  @IsNotEmpty()
  @IsUUID()
  assigneeId!: string;

  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  @IsDateString()
  startDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  returnDate?: Date;

  @Column({ default: false })
  @IsBoolean()
  isPermanent!: boolean;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  @IsEnum(AssignmentStatus)
  status!: AssignmentStatus;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedBy?: string;

  @OneToMany(() => Reminder, (reminder) => reminder.assignment)
  reminders!: Reminder[];

  closeAssignment(): void {
    this.status = AssignmentStatus.COMPLETED;
    if (!this.returnDate) {
      this.returnDate = new Date();
    }
  }
}
