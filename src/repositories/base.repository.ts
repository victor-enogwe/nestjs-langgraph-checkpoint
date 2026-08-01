import pg from 'pg';
import type {
  Attributes,
  BulkCreateOptions,
  CreateOptions,
  CreationAttributes,
  DestroyOptions,
  FindOptions,
  InferAttributes,
  InferCreationAttributes,
  NonNullFindOptions,
  Transaction,
  TransactionOptions,
  UpdateOptions,
  UpsertOptions,
} from 'sequelize';
import type { Model, Repository } from 'sequelize-typescript';
import type { MakeNullishOptional } from 'sequelize/lib/utils';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export abstract class BaseRepository<M extends Model> {
  abstract readonly repository: Repository<M>;

  private setSchema<T extends object>(
    options: T = {} as T,
    schema?: string,
  ): T {
    if (!schema || schema?.length === 0) return options;

    const searchPath = pg.escapeIdentifier(schema);

    Reflect.set(options, 'schema', schema);
    Reflect.set(options, 'searchPath', searchPath);

    return options;
  }

  async transaction(
    options?: TransactionOptions,
  ): Promise<Transaction | undefined> {
    return this.repository.sequelize?.transaction(options);
  }

  async findOne(
    options?: Omit<NonNullFindOptions<InferAttributes<M>>, 'searchPath'>,
    tenant?: string,
  ): Promise<M | null> {
    return this.repository.findOne(this.setSchema(options, tenant));
  }

  async findMany(
    options?: Omit<FindOptions<InferAttributes<M>>, 'searchPath'>,
    tenant?: string,
  ): Promise<M[]> {
    return this.repository.findAll({
      ...options,
      ...this.setSchema({}, tenant),
    });
  }

  async create(
    params: CreationAttributes<M>,
    options: Omit<CreateOptions<Attributes<M>>, 'searchPath'> = {},
    tenant?: string,
  ): Promise<M> {
    const entity = await this.repository.create(
      params,
      this.setSchema(options, tenant),
    );

    return entity;
  }

  async batchCreate(
    entities: Array<CreationAttributes<M>>,
    options?: Omit<BulkCreateOptions<InferAttributes<M>>, 'searchPath'>,
    tenant?: string,
  ): Promise<M[]> {
    return this.repository.bulkCreate(
      entities,
      this.setSchema(options, tenant),
    );
  }

  async upsert(
    entity: MakeNullishOptional<InferCreationAttributes<M>>,
    options?: Omit<UpsertOptions<InferAttributes<M>>, 'searchPath'>,
    tenant?: string,
  ): Promise<[M, boolean | null]> {
    return this.repository.upsert(entity, this.setSchema(options, tenant));
  }

  async update(
    fields: Partial<CreationAttributes<M>>,
    options?: Omit<UpdateOptions<InferAttributes<M>>, 'searchPath'>,
    tenant?: string,
  ): Promise<M> {
    const queryOptions = this.setSchema(options, tenant);
    const entity = await this.repository.findOne(queryOptions);

    if (!entity) {
      throw new Error(`${this.repository.name.toLowerCase()} not found`);
    }

    entity.setAttributes(fields);

    return entity.save(queryOptions);
  }

  async delete(
    options?: Omit<DestroyOptions<InferAttributes<M>>, 'searchPath'>,
    tenant?: string,
  ): Promise<number> {
    const result = await this.repository.destroy(
      this.setSchema(options, tenant),
    );

    return result;
  }
}
