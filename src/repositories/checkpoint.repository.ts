import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Repository, Sequelize } from 'sequelize-typescript';
import { CheckpointEntity } from '../entities/checkpoint.entity';
import { BaseRepository, DATABASE_CONNECTION } from './base.repository';

@Injectable()
export class CheckpointRepository extends BaseRepository<CheckpointEntity> {
  readonly repository: Repository<CheckpointEntity>;

  constructor(
    @InjectConnection(DATABASE_CONNECTION)
    private readonly dataSource: Sequelize,
  ) {
    super();

    this.repository = this.dataSource.getRepository(CheckpointEntity);
  }
}
