import { Repository, FindManyOptions } from 'typeorm';
import { BaseEntityWithTimestamps } from '../entities/base.entity';

/**
 * Base Repository with pagination support
 * Extends TypeORM Repository to add pagination functionality
 */
export class BaseRepository<T extends BaseEntityWithTimestamps> extends Repository<T> {
  /**
   * Find entities with pagination
   * @param options Find options including page and pageSize
   * @returns Object with items array and total count
   */
  async findPaginated(
    options: FindManyOptions<T> & { page: number; pageSize: number },
  ): Promise<{ items: T[]; total: number }> {
    const { page, pageSize, ...findOptions } = options;

    // Validate and set defaults
    const validPage = Math.max(1, Math.floor(page) || 1);
    const validPageSize = Math.min(100, Math.max(1, Math.floor(pageSize) || 10));

    // Calculate skip and take
    const skip = (validPage - 1) * validPageSize;
    const take = validPageSize;

    // Execute find and count in parallel
    const [items, total] = await Promise.all([
      this.find({
        ...findOptions,
        skip,
        take,
      }),
      this.count({
        ...findOptions,
      }),
    ]);

    return { items, total };
  }
}
