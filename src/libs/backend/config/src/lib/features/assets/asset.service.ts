import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './asset.entity';
import { BaseService } from '../../users/services/base.service';
import { AssetStatus } from '../shared/enums';

@Injectable()
export class AssetService extends BaseService<Asset> {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {
    super(assetRepository);
  }

  async findByStatus(status: AssetStatus): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: AssetStatus): Promise<Asset> {
    const asset = await this.findById(id);
    asset.updateStatus(status);
    return await this.assetRepository.save(asset);
  }

  async findBySerialNumber(serialNumber: string): Promise<Asset | null> {
    return await this.assetRepository.findOne({
      where: { serialNumber },
    });
  }
}
