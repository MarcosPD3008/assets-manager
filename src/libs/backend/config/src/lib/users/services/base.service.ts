import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
} from 'typeorm';
import { BaseEntityWithTimestamps } from '../entities/base.entity';

@Injectable()
export abstract class BaseService<T extends BaseEntityWithTimestamps> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    const findOptions: FindManyOptions<T> = {
      ...options,
      withDeleted: false, // Excluir registros eliminados por defecto
    };
    return await this.repository.find(findOptions);
  }

  async findAllPaginated(
    options: FindManyOptions<T> & { page: number; pageSize: number },
  ): Promise<{ items: T[]; total: number }> {
    const { page, pageSize, ...findOptions } = options;

    // Validate and set defaults
    const validPage = Math.max(1, Math.floor(page) || 1);
    const validPageSize = Math.min(100, Math.max(1, Math.floor(pageSize) || 10));

    // Calculate skip and take
    const skip = (validPage - 1) * validPageSize;
    const take = validPageSize;

    // Apply withDeleted: false by default
    const paginationOptions: FindManyOptions<T> = {
      ...findOptions,
      skip,
      take,
      withDeleted: false,
    };

    // Execute find and count in parallel
    const [items, total] = await Promise.all([
      this.repository.find(paginationOptions),
      this.repository.count({
        ...findOptions,
        withDeleted: false,
      }),
    ]);

    return { items, total };
  }

  async findAllWithDeleted(options?: FindManyOptions<T>): Promise<T[]> {
    const findOptions: FindManyOptions<T> = {
      ...options,
      withDeleted: true, // Incluir registros eliminados
    };
    return await this.repository.find(findOptions);
  }

  async findOne(options: FindOneOptions<T>): Promise<T> {
    const findOptions: FindOneOptions<T> = {
      ...options,
      withDeleted: false, // Excluir registros eliminados por defecto
    };
    const entity = await this.repository.findOne(findOptions);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    return entity;
  }

  async findById(id: string, relations?: string[]): Promise<T> {
    return await this.findOne({
      where: { id } as any,
      relations,
    });
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return await this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findById(id);
    await this.repository.softRemove(entity);
  }

  async hardDelete(id: string): Promise<void> {
    const entity = await this.findById(id);
    await this.repository.remove(entity);
  }

  async restore(id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as any,
      withDeleted: true,
    });
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    await this.repository.restore(id);
    return await this.findById(id);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    const countOptions: FindManyOptions<T> = {
      ...options,
      withDeleted: false,
    };
    return await this.repository.count(countOptions);
  }

  async countWithDeleted(options?: FindManyOptions<T>): Promise<number> {
    const countOptions: FindManyOptions<T> = {
      ...options,
      withDeleted: true,
    };
    return await this.repository.count(countOptions);
  }

  async exists(options: FindOneOptions<T>): Promise<boolean> {
    const count = await this.repository.count({
      ...(options as FindManyOptions<T>),
      withDeleted: false,
    });
    return count > 0;
  }
}
