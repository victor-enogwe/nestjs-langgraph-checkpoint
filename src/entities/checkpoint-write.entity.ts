import { type CreationOptional, type NonAttribute } from 'sequelize';
import { Column, DataType, Table } from 'sequelize-typescript';
import { MixinEntity } from './mixin.entity';

@Table({ tableName: 'checkpoint_writes' })
export class CheckpointWriteEntity extends MixinEntity<CheckpointWriteEntity> {
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

  @Column({
    field: 'checkpoint_id',
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
  })
  declare checkpointId: CreationOptional<string>;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: '',
    primaryKey: true,
    field: 'checkpoint_ns',
  })
  declare checkpointNs: string;

  @Column({
    type: DataType.TEXT,
    primaryKey: true,
    allowNull: false,
    field: 'task_id',
  })
  declare taskId: string;

  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'idx',
  })
  declare idx: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare channel: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare type?: string;

  @Column({ type: DataType.BLOB, allowNull: false })
  declare blob: Uint8Array<ArrayBufferLike>;
}
