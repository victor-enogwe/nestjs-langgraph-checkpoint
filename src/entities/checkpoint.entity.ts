import type { Checkpoint } from '@langchain/langgraph-checkpoint';
import {
  Association,
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  type CreationOptional,
  fn,
  HasManyAddAssociationMixin,
  HasManyAddAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManyHasAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManyRemoveAssociationsMixin,
  HasManySetAssociationsMixin,
  type NonAttribute,
} from 'sequelize';
import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  IsUUID,
  Table,
} from 'sequelize-typescript';
import { BelongsToMixin, HasManyMixin } from '../types/sequelize.module';
import { CheckpointBlobEntity } from './checkpoint-blob.entity';
import { MixinEntity } from './mixin.entity';

@Table({ tableName: 'checkpoints' })
export class CheckpointEntity
  extends MixinEntity<CheckpointEntity>
  implements
    HasManyMixin<CheckpointEntity, 'string', 'checkpoint', 'checkpoints'>,
    BelongsToMixin<CheckpointEntity, string, 'parent'>
{
  declare getParent: BelongsToGetAssociationMixin<CheckpointEntity>;
  declare setParent: BelongsToSetAssociationMixin<CheckpointEntity, string>;
  declare createParent: BelongsToCreateAssociationMixin<CheckpointEntity>;
  declare getCheckpoints: HasManyGetAssociationsMixin<CheckpointEntity>;
  declare countCheckpoints: HasManyCountAssociationsMixin;
  declare hasCheckpoints: HasManyHasAssociationsMixin<
    CheckpointEntity,
    'string'
  >;
  declare setCheckpoints: HasManySetAssociationsMixin<
    CheckpointEntity,
    'string'
  >;
  declare addCheckpoints: HasManyAddAssociationsMixin<
    CheckpointEntity,
    'string'
  >;
  declare removeCheckpoints: HasManyRemoveAssociationsMixin<
    CheckpointEntity,
    'string'
  >;
  declare hasCheckpoint: HasManyHasAssociationMixin<CheckpointEntity, 'string'>;
  declare addCheckpoint: HasManyAddAssociationMixin<CheckpointEntity, 'string'>;
  declare removeCheckpoint: HasManyRemoveAssociationMixin<
    CheckpointEntity,
    'string'
  >;
  declare createCheckpoint: HasManyCreateAssociationMixin<CheckpointEntity>;

  declare static associations: {
    parent: Association<CheckpointEntity, CheckpointEntity>;
    checkpoints: Association<CheckpointEntity, CheckpointEntity>;
  };

  @Column({
    field: 'uuid',
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: fn('UUID_GENERATE_V6'),
    comment: 'checkpoint id',
  })
  declare uuid: CreationOptional<string>;

  @Column({
    type: 'UUID GENERATED ALWAYS AS (uuid) STORED',
    allowNull: true,
    comment: 'checkpoint id mirrors uuid field',
    set() {
      throw new Error('checkpointId is read-only');
    },
  })
  declare checkpointId: NonAttribute<string>;

  @IsUUID(4)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    field: 'thread_id',
    comment: 'thread(session) id',
  })
  declare threadId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: '',
    primaryKey: true,
    field: 'checkpoint_ns',
  })
  declare checkpointNs: string;

  @Column({
    field: 'parent_checkpoint_id',
    type: DataType.UUID,
    allowNull: true,
  })
  declare parentCheckpointId?: string;

  @Column({ type: DataType.TEXT })
  declare type?: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare checkpoint: Checkpoint;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  declare metadata: Record<string, unknown>;

  @BelongsTo(() => CheckpointEntity, {
    targetKey: 'uuid',
    foreignKey: 'parent_checkpoint_id',
    as: 'parent',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    hooks: true,
  })
  declare parent: NonAttribute<Promise<CheckpointEntity>>;

  @HasMany(() => CheckpointBlobEntity, {
    foreignKey: 'parent_checkpoint_id',
    sourceKey: 'uuid',
    as: 'checkpoints',
  })
  declare checkpoints?: NonAttribute<Promise<CheckpointEntity[]>>;
}
