import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IStorageProvider } from './storage.interface';
import * as crypto from 'crypto';
import type { Express } from 'express';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads');
  private readonly cdnBaseUrl =
    process.env.MEDIA_CDN_BASE_URL || 'http://localhost:3001';

  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ensured at ${this.uploadDir}`);
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  async upload(
    file: Express.Multer.File,
    filePath: string,
  ): Promise<{ url: string; key: string }> {
    try {
      const uploadPath = path.join(this.uploadDir, filePath);
      const uploadDirPath = path.dirname(uploadPath);

      // Ensure directory exists
      await fs.mkdir(uploadDirPath, { recursive: true });

      // Write file
      await fs.writeFile(uploadPath, file.buffer);

      const key = `uploads/${filePath}`;
      const url = `${this.cdnBaseUrl}/${key}`;

      this.logger.log(`File uploaded: ${key}`);
      return { url, key };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'public', key);
      await fs.unlink(filePath);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file ${key}: ${error.message}`);
    }
  }

  async getUrl(key: string): Promise<string> {
    return `${this.cdnBaseUrl}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = path.join(process.cwd(), 'public', key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate unique filename with timestamp and hash
   */
  generateFileName(file: Express.Multer.File): string {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    return `${nameWithoutExt}-${timestamp}-${hash}${ext}`;
  }
}
