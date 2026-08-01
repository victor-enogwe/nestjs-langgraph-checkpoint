# @sarvis/nestjs-langgraph-checkpoint

A NestJS-compatible checkpoint persistence library for LangChain LangGraph checkpointing using Sequelize and PostgreSQL.

## Overview

This repository implements a Sequelize-backed checkpoint storage layer for the `@langchain/langgraph-checkpoint` checkpointing system. It provides:

- `CheckpointEntity`, `CheckpointBlobEntity`, and `CheckpointWriteEntity` entity models for Postgres storage
- Repository wrappers with tenant-aware schema handling
- `CheckpointerService` that serializes/deserializes LangGraph checkpoint metadata, channel values, and write payloads
- Build tooling with `tsup` and TypeScript

## Features

- Serializable LangChain checkpoint persistence for NestJS applications
- Postgres-specific storage using `sequelize-typescript`
- Support for checkpoint metadata, channel values, pending sends, and intermediate writes
- Tenant-aware repository helper with schema/search path support

## Requirements

- Node.js 20+ (recommended)
- PostgreSQL
- `@nestjs/common`, `@nestjs/sequelize`
- `sequelize`, `sequelize-typescript`
- `pg`
- `@langchain/core`
- `@langchain/langgraph-checkpoint`
- TypeScript 5+

## Installation

Install dependencies with pnpm:

```bash
pnpm install
```

it is intended to be used as part of a monorepo or local workspace, not published to npm.

## Build

```bash
pnpm build
```

Other useful commands:

```bash
pnpm check
pnpm lint
pnpm format
```

## Project Structure

- `src/entities/` — Sequelize entity definitions for checkpoint storage
- `src/repositories/` — Base repository and entity-specific repository wrappers
- `src/services/checkpointer.service.ts` — Main checkpoint persistence service
- `tsup.config.ts` — Build configuration for ESM/CJS bundles with type generation

## Public exports

The package exports the following modules:

- `./entities/checkpoint`
- `./entities/checkpoint-blob`
- `./entities/checkpoint-write`
- `./entities/base`
- `./repositories/checkpoint`
- `./repositories/checkpoint-blob`
- `./repositories/checkpoint-write`
- `./services/checkpointer`

## Usage

A typical NestJS integration looks like this:

```ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CheckpointEntity } from '@sarvis/nestjs-langgraph-checkpoint/entities/checkpoint';
import { CheckpointBlobEntity } from '@sarvis/nestjs-langgraph-checkpoint/entities/checkpoint-blob';
import { CheckpointWriteEntity } from '@sarvis/nestjs-langgraph-checkpoint/entities/checkpoint-write';
import { CheckpointerService } from '@sarvis/nestjs-langgraph-checkpoint/services/checkpointer';
import { DATABASE_CONNECTION } from '@sarvis/nestjs-langgraph-checkpoint/repositories/base';
import { CheckpointRepository } from '@sarvis/nestjs-langgraph-checkpoint/repositories/checkpoint';
import { CheckpointBlobRepository } from '@sarvis/nestjs-langgraph-checkpoint/repositories/checkpoint-blob';
import { CheckpointWriteRepository } from '@sarvis/nestjs-langgraph-checkpoint/repositories/checkpoint-write';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CheckpointEntity,
      CheckpointBlobEntity,
      CheckpointWriteEntity,
    ]),
  ],
  providers: [
    { provide: DATABASE_CONNECTION, useValue: "<YOUR_DB_NAME>" },
    CheckpointRepository,
    CheckpointBlobRepository,
    CheckpointWriteRepository,
    CheckpointerService,
  ],
  exports: [CheckpointerService],
})
export class LangGraphCheckpointModule {}
```

Then inject `CheckpointerService` into your module or service:

```ts
import { Injectable } from '@nestjs/common';
import { CheckpointerService } from '@sarvis/nestjs-langgraph-checkpoint/services/checkpointer';

@Injectable()
export class AppService {
  constructor(private readonly checkpointer: CheckpointerService) {}
}
```

### Example service methods

The `CheckpointerService` exposes the following high-level operations:

- `getTuple(config, options?)` — fetch the latest checkpoint tuple for a runnable config
- `list(config, options?)` — iterate over historical checkpoint tuples
- `put(config, checkpoint, metadata, newVersions)` — persist a checkpoint and associated channel version blobs
- `putWrites(config, writes, taskId)` — persist intermediate task writes linked to a checkpoint

## Database schema notes

The entities are built for PostgreSQL and use UUID-based primary keys. Key tables include:

- `checkpoints`
- `checkpoint_blobs`
- `checkpoint_writes`

The schema relies on Postgres JSONB storage for checkpoint payloads and metadata. Ensure the target database supports the required UUID generation functions and types.

## Contributing

This repository is structured as a private package. To contribute or extend it:

1. Install dependencies: `pnpm install`
2. Build: `pnpm build`
3. Run type checks: `pnpm check`
4. Format code: `pnpm format`

## License

MIT
