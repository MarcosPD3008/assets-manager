import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Or, IsNull } from 'typeorm';
import { Assignment } from './assignment.entity';
import { BaseService } from '../../users/services/base.service';
import { AssignmentStatus } from '../shared/enums';

@Injectable()
export class AssignmentService extends BaseService<Assignment> {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
  ) {
    super(assignmentRepository);
  }

  async closeAssignment(id: string): Promise<Assignment> {
    const assignment = await this.findById(id, ['asset', 'assignee']);
    assignment.closeAssignment();
    return await this.assignmentRepository.save(assignment);
  }

  async findActiveAssignments(): Promise<Assignment[]> {
    return await this.assignmentRepository.find({
      where: { status: AssignmentStatus.ACTIVE },
      relations: ['asset', 'assignee'],
      order: { startDate: 'DESC' },
    });
  }

  async findByAsset(assetId: string): Promise<Assignment[]> {
    return await this.assignmentRepository.find({
      where: { assetId },
      relations: ['assignee'],
      order: { startDate: 'DESC' },
    });
  }

  async findByContact(contactId: string): Promise<Assignment[]> {
    return await this.assignmentRepository.find({
      where: { assigneeId: contactId },
      relations: ['asset'],
      order: { startDate: 'DESC' },
    });
  }

  async findActiveByMonth(year: number, month: number): Promise<Assignment[]> {
    // Calcular inicio y fin del mes
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    return await this.assignmentRepository.find({
      where: [
        {
          status: AssignmentStatus.ACTIVE,
          startDate: LessThanOrEqual(endOfMonth),
          dueDate: MoreThanOrEqual(startOfMonth),
        },
        {
          status: AssignmentStatus.ACTIVE,
          startDate: LessThanOrEqual(endOfMonth),
          isPermanent: true,
        },
      ],
      relations: ['asset', 'assignee'],
      order: { startDate: 'ASC' },
    });
  }
}
