import { Injectable, Logger } from '@nestjs/common';
import { IStorageProvider } from './storage.interface';
import * as crypto from 'crypto';
import type { Express } from 'express';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private s3Client: any;
  private bucket = process.env.MEDIA_STORAGE_BUCKET || 'itukuapp-media';

  constructor() {
    this.initializeS3();
  }

  private initializeS3() {
    try {
      // Only initialize if AWS credentials are available
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const region = process.env.AWS_REGION || 'us-east-1';

      if (!accessKeyId || !secretAccessKey) {
        this.logger.warn('AWS credentials not configured. S3StorageProvider will not work.');
        return;
      }

      // Dynamically require AWS SDK if available
      try {
        const AWS = require('aws-sdk');
        this.s3Client = new AWS.S3({
          accessKeyId,
          secretAccessKey,
          region,
        });
        this.logger.log('S3StorageProvider initialized successfully');
      } catch (error) {
        this.logger.error('aws-sdk not installed. Install with: npm install aws-sdk');
      }
    } catch (error) {
      this.logger.error(`Failed to initialize S3: ${error.message}`);
    }
  }

  async upload(file: Express.Multer.File, filePath: string): Promise<{ url: string; key: string }> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized. Configure AWS credentials.');
    }

    try {
      const key = `uploads/${filePath}`;
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
        Metadata: {
          'original-name': file.originalname,
        },
      };

      await this.s3Client.upload(params).promise();
      const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;

      this.logger.log(`File uploaded to S3: ${key}`);
      return { url, key };
    } catch (error) {
      this.logger.error(`Failed to upload to S3: ${error.message}`);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.s3Client) {
      this.logger.warn('S3 client not initialized. Skipping delete.');
      return;
    }

    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3Client.deleteObject(params).promise();
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.warn(`Failed to delete from S3 ${key}: ${error.message}`);
    }
  }

  async getUrl(key: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized.');
    }

    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: 3600, // 1 hour
      };

      const url = await this.s3Client.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      this.logger.error(`Failed to get S3 URL: ${error.message}`);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.s3Client) {
      return false;
    }

    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3Client.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      this.logger.error(`Failed to check S3 object existence: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate unique filename with timestamp and hash
   */
  generateFileName(file: Express.Multer.File): string {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = require('path').extname(file.originalname);
    const nameWithoutExt = require('path').basename(file.originalname, ext);
    return `${nameWithoutExt}-${timestamp}-${hash}${ext}`;
  }
}
