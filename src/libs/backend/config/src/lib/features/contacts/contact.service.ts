import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { BaseService } from '../../users/services/base.service';

@Injectable()
export class ContactService extends BaseService<Contact> {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {
    super(contactRepository);
  }

  async findByEmail(email: string): Promise<Contact | null> {
    return await this.contactRepository.findOne({
      where: { email },
    });
  }

  async findByDepartment(department: string): Promise<Contact[]> {
    return await this.contactRepository.find({
      where: { department },
      order: { name: 'ASC' },
    });
  }
}
