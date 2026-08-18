import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageProvider } from './storage-local.provider';
import { S3StorageProvider } from './storage-s3.provider';

@Module({
  providers: [StorageService, LocalStorageProvider, S3StorageProvider],
  exports: [StorageService],
})
export class StorageModule {}
