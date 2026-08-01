import { type CreationOptional, type NonAttribute } from 'sequelize';
import { Column, DataType, Table } from 'sequelize-typescript';
import { MixinEntity } from './mixin.entity';

@Table({ tableName: 'checkpoint_blobs', version: false })
export class CheckpointBlobEntity extends MixinEntity<CheckpointBlobEntity> {
  @Column({
    field: 'uuid',
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    comment: 'thread(session) id',
  })
  declare uuid: CreationOptional<string>;

  @Column({
    type: 'UUID GENERATED ALWAYS AS (uuid) STORED',
    allowNull: true,
    comment: 'thread(session) id mirrors uuid field',
    set() {
      throw new Error('threadId is read-only');
    },
  })
  declare threadId: NonAttribute<string>;

  @Column({ field: 'checkpoint_id', allowNull: false, type: DataType.UUID })
  declare checkpointId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    primaryKey: true,
    defaultValue: '',
    field: 'checkpoint_ns',
  })
  declare checkpointNs: string;

  @Column({ type: DataType.TEXT, allowNull: false, primaryKey: true })
  declare channel: string;

  @Column({ type: DataType.TEXT, allowNull: false, primaryKey: true })
  declare version: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare type: string;

  @Column({ type: DataType.BLOB, allowNull: true })
  declare blob?: Uint8Array<ArrayBufferLike>;
}
