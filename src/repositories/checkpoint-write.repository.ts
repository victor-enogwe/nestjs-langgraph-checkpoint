import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Repository, Sequelize } from 'sequelize-typescript';
import { CheckpointWriteEntity } from '../entities/checkpoint-write.entity';
import { BaseRepository, DATABASE_CONNECTION } from './base.repository';

@Injectable()
export class CheckpointWriteRepository extends BaseRepository<CheckpointWriteEntity> {
  readonly repository: Repository<CheckpointWriteEntity>;

  constructor(
    @InjectConnection(DATABASE_CONNECTION)
    private readonly dataSource: Sequelize,
  ) {
    super();
    this.repository = this.dataSource.getRepository(CheckpointWriteEntity);
  }
}
