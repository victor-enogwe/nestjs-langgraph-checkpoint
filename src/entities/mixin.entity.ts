import {
  fn,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  IsUUID,
  Model,
  PrimaryKey,
  UpdatedAt,
} from 'sequelize-typescript';

export abstract class MixinEntity<
  Entity extends Omit<Model, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ID = never,
> extends Model<InferAttributes<Entity>, InferCreationAttributes<Entity>> {
  declare id: ID;

  @IsUUID(4)
  @PrimaryKey
  @Column({
    field: 'uuid',
    type: DataType.UUID,
    allowNull: false,
    defaultValue: fn('UUID_GENERATE_V4'),
  })
  declare uuid: CreationOptional<string>;

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE,
    allowNull: false,
    defaultValue: fn('CURRENT_TIMESTAMP', 3),
  })
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column({
    field: 'updated_at',
    type: DataType.DATE,
    allowNull: false,
    defaultValue: fn('CURRENT_TIMESTAMP', 3),
  })
  declare updatedAt: CreationOptional<Date>;

  @DeletedAt
  @Column({
    field: 'deleted_at',
    type: DataType.DATE,
    allowNull: true,
  })
  declare deletedAt: CreationOptional<Date | null>;
}
