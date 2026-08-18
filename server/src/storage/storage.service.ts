import { Injectable, Logger } from '@nestjs/common';
import { LocalStorageProvider } from './storage-local.provider';
import { S3StorageProvider } from './storage-s3.provider';
import { IStorageProvider } from './storage.interface';
import type { Express } from 'express';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: IStorageProvider;

  constructor(
    private localProvider: LocalStorageProvider,
    private s3Provider: S3StorageProvider,
  ) {
    this.selectProvider();
  }

  private selectProvider() {
    const storageProvider = process.env.MEDIA_STORAGE_PROVIDER || 'local';

    if (storageProvider === 's3' || storageProvider === 'aws') {
      this.provider = this.s3Provider;
      this.logger.log('Using S3 storage provider');
    } else {
      this.provider = this.localProvider;
      this.logger.log('Using local storage provider');
    }
  }

  /**
   * Upload a file
   * @param file Express Multer file
   * @param directory Directory path (e.g., 'profiles', 'marketplace')
   * @returns Object with url and key
   */
  async upload(
    file: Express.Multer.File,
    directory: string = 'general',
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileName = this.generateFileName(file);
    const filePath = `${directory}/${fileName}`;

    this.logger.log(`Uploading file: ${fileName} to directory: ${directory}`);

    return this.provider.upload(file, filePath);
  }

  /**
   * Delete a file by key
   * @param key File key (e.g., 'uploads/profiles/filename.jpg')
   */
  async delete(key: string): Promise<void> {
    if (!key) {
      throw new Error('No key provided');
    }

    this.logger.log(`Deleting file: ${key}`);
    return this.provider.delete(key);
  }

  /**
   * Get URL for a file
   * @param key File key
   * @returns File URL
   */
  async getUrl(key: string): Promise<string> {
    if (!key) {
      throw new Error('No key provided');
    }

    return this.provider.getUrl(key);
  }

  /**
   * Check if file exists
   * @param key File key
   * @returns True if file exists
   */
  async exists(key: string): Promise<boolean> {
    if (!key) {
      return false;
    }

    return this.provider.exists(key);
  }

  /**
   * Generate unique filename
   */
  private generateFileName(file: Express.Multer.File): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = require('path').extname(file.originalname);
    const nameWithoutExt = require('path').basename(file.originalname, ext);
    return `${nameWithoutExt}-${timestamp}-${random}${ext}`;
  }
}
