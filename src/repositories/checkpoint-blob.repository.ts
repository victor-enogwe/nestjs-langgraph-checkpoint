import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Repository, Sequelize } from 'sequelize-typescript';
import { CheckpointBlobEntity } from '../entities/checkpoint-blob.entity';
import { BaseRepository, DATABASE_CONNECTION } from './base.repository';

@Injectable()
export class CheckpointBlobRepository extends BaseRepository<CheckpointBlobEntity> {
  readonly repository: Repository<CheckpointBlobEntity>;

  constructor(
    @InjectConnection(DATABASE_CONNECTION)
    private readonly dataSource: Sequelize,
  ) {
    super();

    this.repository = this.dataSource.getRepository(CheckpointBlobEntity);
  }
}
