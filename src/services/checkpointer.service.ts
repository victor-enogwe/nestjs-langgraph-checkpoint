import type { RunnableConfig } from '@langchain/core/runnables';
import type {
  ChannelVersions,
  Checkpoint,
  CheckpointListOptions,
  CheckpointMetadata,
  CheckpointTuple,
  PendingWrite,
  SendProtocol,
} from '@langchain/langgraph-checkpoint';
import {
  BaseCheckpointSaver,
  TASKS,
  WRITES_IDX_MAP,
} from '@langchain/langgraph-checkpoint';
import { Injectable } from '@nestjs/common';
import { TextDecoder } from 'node:util';
import { InferAttributes, literal, Op, WhereOptions } from 'sequelize';
import { CheckpointEntity } from '../entities/checkpoint.entity';
import { CheckpointBlobRepository } from '../repositories/checkpoint-blob.repository';
import { CheckpointWriteRepository } from '../repositories/checkpoint-write.repository';
import { CheckpointRepository } from '../repositories/checkpoint.repository';

export type CheckpointFromDB = CheckpointEntity & {
  channelValues: Array<[Uint8Array, Uint8Array, Uint8Array]>;
  pendingWrites: Array<[Uint8Array, Uint8Array, Uint8Array, Uint8Array]>;
  pendingSends: Array<[Uint8Array, Uint8Array]>;
};

@Injectable()
export class CheckpointerService extends BaseCheckpointSaver {
  constructor(
    private readonly textDecoder: TextDecoder,
    private readonly checkpointRepo: CheckpointRepository,
    private readonly checkpointBlobRepo: CheckpointBlobRepository,
    private readonly checkpointWriteRepo: CheckpointWriteRepository,
  ) {
    super();
  }

  private async loadCheckpoint(
    checkpoint: Omit<Checkpoint, 'pending_sends' | 'channel_values'>,
    channelValues: Array<[Uint8Array, Uint8Array, Uint8Array]>,
    pendingSends: Array<[Uint8Array, Uint8Array]> = [],
  ): Promise<Promise<Checkpoint>> {
    return {
      ...checkpoint,
      pending_sends: await Promise.all(
        (pendingSends ?? []).map(
          ([c, b]) => this.serde.loadsTyped(c.toString(), b) as SendProtocol,
        ),
      ),
      channel_values: await this.loadBlobs(channelValues),
    };
  }

  private async loadBlobs(
    blobValues: Array<[Uint8Array, Uint8Array, Uint8Array]> = [],
  ): Promise<Record<string, unknown>> {
    if (blobValues.length === 0) return {};

    const entries = await Promise.all(
      (blobValues ?? [])
        .filter(([, t]) => this.textDecoder.decode(t) !== 'empty')
        .map(async ([k, t, v]) => [
          this.textDecoder.decode(k),
          (await this.serde.loadsTyped(
            this.textDecoder.decode(t),
            v,
          )) as SendProtocol,
        ]),
    );

    return Object.fromEntries(entries) as Record<string, unknown>;
  }

  private async loadMetadata(
    metadata: Record<string, unknown>,
  ): Promise<CheckpointMetadata> {
    const [type, dumpedValue] = this.serde.dumpsTyped(metadata);

    return Promise.resolve(
      this.serde.loadsTyped(type, dumpedValue) as CheckpointMetadata,
    );
  }

  private async loadWrites(
    writes: Array<[Uint8Array, Uint8Array, Uint8Array, Uint8Array]> = [],
  ): Promise<[string, string, unknown][]> {
    return Promise.all(
      writes.map(async ([tid, channel, t, v]) => [
        this.textDecoder.decode(tid),
        this.textDecoder.decode(channel),
        await this.serde.loadsTyped(this.textDecoder.decode(t), v),
      ]),
    );
  }

  private dumpBlobs(
    threadId: string,
    checkpointNs: string,
    values: Record<string, unknown>,
    versions: ChannelVersions,
  ): [string, string, string, string, string, Uint8Array | undefined][] {
    if (Object.keys(versions).length === 0) return [];

    return Object.entries(versions).map(([k, ver]) => {
      const [type, value] =
        k in values ? this.serde.dumpsTyped(values[k]) : ['empty', null];
      return [
        threadId,
        checkpointNs,
        k,
        ver.toString(),
        type,
        value ? new Uint8Array(value) : undefined,
      ];
    });
  }

  private dumpCheckpoint(checkpoint: Checkpoint): Checkpoint<string, string> {
    const serialized: Record<string, unknown> = {
      ...checkpoint,
      pending_sends: [],
    };

    if ('channel_values' in serialized) delete serialized['channel_values'];

    return serialized as unknown as Checkpoint<string, string>;
  }

  private dumpMetadata(metadata: CheckpointMetadata): Record<string, unknown> {
    const [, serializedMetadata] = this.serde.dumpsTyped(metadata);

    return JSON.parse(
      this.textDecoder.decode(serializedMetadata).replace(/\0/g, ''),
    ) as Record<string, unknown>;
  }

  private dumpWrites(
    threadId: string,
    checkpointNs: string,
    checkpointId: string,
    taskId: string,
    writes: Array<[string, unknown]> = [],
  ): [string, string, string, string, number, string, string, Uint8Array][] {
    return writes.map(([channel, value], idx) => {
      const [type, serializedValue] = this.serde.dumpsTyped(value);
      const writesIndexMap = WRITES_IDX_MAP[channel];

      return [
        threadId,
        checkpointNs,
        checkpointId,
        taskId,
        writesIndexMap ? writesIndexMap : idx,
        channel,
        type,
        new Uint8Array(serializedValue),
      ];
    });
  }

  private async findCheckpoints(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): Promise<CheckpointFromDB[]> {
    const { filter, before, limit } = options ?? {};
    const { configurable = {} } = config;
    const threadId = configurable['thread_id'] as string;
    const tenantUuid = configurable['tenantUuid'] as string;
    const checkpointNs = (configurable['checkpoint_ns'] as string) ?? '';
    const checkpointId = configurable['checkpoint_id'] as string;
    const beforeConfigurable = before?.configurable ?? {};

    const where: WhereOptions<
      InferAttributes<
        CheckpointEntity,
        {
          omit: never;
        }
      >
    > = { threadId, checkpointNs };

    if (checkpointId.length > 0) {
      where.uuid = {
        [Op.and]: {
          ...(checkpointId ? { [Op.eq]: checkpointId } : {}),
          ...(beforeConfigurable['checkpoint_id']
            ? { [Op.lt]: beforeConfigurable['checkpoint_id'] as string }
            : {}),
        },
      };

      if (filter && Object.keys(filter ?? {}).length > 0) {
        where.metadata = filter;
      }
    }

    const checkpoints = await this.checkpointRepo.findMany(
      {
        attributes: [
          'threadId',
          'checkpoint',
          'checkpointNs',
          'checkpointId',
          'parentCheckpointId',
          'metadata',
          [
            literal(`(
            SELECT ARRAY_AGG(
              ARRAY[bl.channel::bytea, bl.type::bytea, bl.blob]
            )
            FROM JSONB_EACH_TEXT("checkpoint" -> 'channel_versions')
            INNER JOIN checkpoint_blobs bl
              ON bl.thread_id = "thread_id"
              AND bl.checkpoint_ns = "checkpoint_ns"
              AND bl.channel = JSONB_EACH_TEXT.key
              AND bl.version = JSONB_EACH_TEXT.value
            )`),
            'channelValues',
          ],
          [
            literal(`(
            SELECT ARRAY_AGG(
              ARRAY[
                cw.task_id::text::bytea,
                cw.channel::bytea,
                cw.type::bytea,
                cw.blob
              ]
              ORDER BY cw.task_id, cw.idx
            )
            FROM checkpoint_writes cw
            WHERE cw.thread_id = "thread_id"
              AND cw.checkpoint_ns = "checkpoint_ns"
              AND cw.checkpoint_id = "checkpoint_id"
            )`),
            'pendingWrites',
          ],
          [
            literal(`(
            SELECT ARRAY_AGG(
              ARRAY[cw.type::bytea, cw.blob]
              ORDER BY cw.idx
            )
            FROM checkpoint_writes cw
            WHERE cw.thread_id = "thread_id"
              AND cw.checkpoint_ns = "checkpoint_ns"
              AND cw.checkpoint_id = "parent_checkpoint_id"
              AND cw.channel = :tasks
            )`),
            'pendingSends',
          ],
        ],
        where,
        replacements: { tasks: TASKS },
        order: [['createdAt', 'DESC']],
        limit: !checkpointId ? limit : 1,
        raw: true,
      },
      tenantUuid,
    );

    return checkpoints as CheckpointFromDB[];
  }

  private async getTupleInternal(
    config: RunnableConfig,
    checkpoint: CheckpointFromDB,
  ): Promise<CheckpointTuple | undefined> {
    const { configurable = {} } = config;
    const thread_id = configurable['thread_id'] as string;
    const checkpoint_ns = (configurable['checkpoint_ns'] as string) ?? '';

    if (!checkpoint) return undefined;

    const loadedCheckpoint = await this.loadCheckpoint(
      checkpoint.checkpoint,
      checkpoint.channelValues,
      checkpoint.pendingSends,
    );

    const metadata = await this.loadMetadata(checkpoint.metadata);

    const pendingWrites = await this.loadWrites(checkpoint.pendingWrites);

    const finalConfig: RunnableConfig = {
      configurable: {
        thread_id: thread_id,
        checkpoint_ns: checkpoint_ns,
        checkpoint_id: checkpoint.checkpointId,
      },
    };

    const parentConfig: RunnableConfig | undefined =
      checkpoint.parentCheckpointId
        ? {
            configurable: {
              thread_id: thread_id,
              checkpoint_ns: checkpoint_ns,
              checkpoint_id: checkpoint.parentCheckpointId,
            },
          }
        : undefined;

    return {
      config: finalConfig,
      checkpoint: loadedCheckpoint,
      metadata,
      parentConfig,
      pendingWrites,
    };
  }

  async getTuple(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): Promise<CheckpointTuple | undefined> {
    const [checkpoint] = await this.findCheckpoints(config, options);

    return this.getTupleInternal(config, checkpoint);
  }

  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): AsyncGenerator<CheckpointTuple> {
    const checkpoints = await this.findCheckpoints(config, options);

    for (const dbCheckpoint of checkpoints) {
      const { threadId, checkpointNs, checkpointId } = dbCheckpoint;

      const configurable: RunnableConfig['configurable'] = {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId,
      };

      const tuple = await this.getTupleInternal(
        { ...config, configurable },
        dbCheckpoint,
      );

      yield tuple!;
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions,
  ): Promise<RunnableConfig> {
    const transaction = await this.checkpointRepo.transaction();

    try {
      const { configurable = {} } = config;

      if (Object.keys(configurable).length === 0) {
        throw new Error(
          'Missing or empty "configurable" field in "config" param',
        );
      }

      const tenantUuid = configurable['tenantUuid'] as string;
      const threadId = configurable['thread_id'] as string;
      const checkpointNs = (configurable['checkpoint_ns'] as string) ?? '';
      const checkpointId = configurable['checkpoint_id'] as string;

      const nextConfig = {
        configurable: {
          thread_id: threadId,
          checkpoint_ns: checkpointNs,
          checkpoint_id: checkpoint.id,
        },
      };

      const serializedBlobs = this.dumpBlobs(
        threadId,
        checkpointNs,
        checkpoint.channel_values,
        newVersions,
      );

      // Create/update checkpoint
      await this.checkpointRepo.upsert(
        {
          threadId: threadId,
          checkpointNs: checkpointNs,
          uuid: checkpoint.id,
          parentCheckpointId: checkpointId,
          checkpoint: this.dumpCheckpoint(checkpoint),
          metadata: this.dumpMetadata(metadata),
        },
        {
          transaction,
          conflictFields: [
            'thread_id',
            'checkpoint_ns',
            'uuid',
          ] as Array<'uuid'>,
          fields: ['checkpoint', 'metadata'],
          returning: false,
        },
        tenantUuid,
      );

      await Promise.all(
        serializedBlobs.map(
          ([threadId, checkpointNs, channel, version, type, blob]) =>
            this.checkpointBlobRepo.create(
              {
                uuid: threadId,
                checkpointNs,
                channel,
                version,
                type,
                blob: blob ? Buffer.from(blob) : undefined,
                checkpointId: checkpoint.id,
              },
              { transaction, ignoreDuplicates: true },
              tenantUuid,
            ),
        ),
      );

      await transaction?.commit();

      return nextConfig;
    } catch (error) {
      await transaction?.rollback();

      throw error;
    }
  }

  /**
   * Store intermediate writes linked to a checkpoint.
   *
   * This method saves intermediate writes associated with a checkpoint
   * to the Postgres database.
   * @param config Configuration of the related checkpoint.
   * @param writes List of writes to store.
   * @param taskId Identifier for the task creating the writes.
   */
  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    const transaction = await this.checkpointRepo.transaction();

    try {
      const { configurable = {} } = config;
      const tenantUuid = configurable['tenantUuid'] as string;
      const threadId = configurable['thread_id'] as string;
      const checkpointNs = (configurable['checkpoint_ns'] as string) ?? '';
      const checkpointId = configurable['checkpoint_id'] as string;
      const insert = writes.every(([channel]) => channel in WRITES_IDX_MAP);

      const dumpedWrites = this.dumpWrites(
        threadId,
        checkpointNs,
        checkpointId,
        taskId,
        writes,
      );

      for (const [
        threadId,
        checkpointNs,
        checkpointId,
        taskId,
        idx,
        channel,
        type,
        blob,
      ] of dumpedWrites) {
        const attributes = {
          uuid: threadId,
          checkpointNs,
          checkpointId,
          taskId,
          idx,
          channel,
          type,
          blob: Buffer.from(blob),
        };

        if (insert) {
          await this.checkpointWriteRepo.create(
            attributes,
            { transaction, ignoreDuplicates: true },
            tenantUuid,
          );
        } else {
          await this.checkpointWriteRepo.upsert(
            attributes,
            {
              transaction,
              fields: ['channel', 'type', 'blob'],
              conflictFields: [
                'uuid',
                'checkpoint_ns',
                'checkpoint_id',
                'task_id',
                'idx',
              ] as Array<'idx'>,
              returning: false,
            },
            tenantUuid,
          );
        }
      }

      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();

      throw error;
    }
  }
}
