import type { Express } from 'express';

export interface IStorageProvider {
  upload(
    file: Express.Multer.File,
    path: string,
  ): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  exists(key: string): Promise<boolean>;
}
