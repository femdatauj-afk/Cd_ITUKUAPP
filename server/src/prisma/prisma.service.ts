import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends (PrismaClient as any)
  implements OnModuleInit, OnModuleDestroy
{
  [key: string]: any;

  constructor() {
    const databaseUrl =
      process.env.DATABASE_URL ??
      'postgresql://itukuapp_user:itukuapp_password@localhost:55432/itukuapp_db?schema=public';

    process.env.DATABASE_URL = databaseUrl;

    const adapter = databaseUrl.startsWith('file:')
      ? new PrismaBetterSqlite3({
          url: path.resolve(__dirname, '../', databaseUrl.slice(5)),
        })
      : new PrismaPg({ connectionString: databaseUrl });

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    return;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
