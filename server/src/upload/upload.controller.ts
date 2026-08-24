import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import type { Express } from 'express';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private storageService: StorageService) {}

  /**
   * Generic file upload endpoint
   * POST /api/upload?directory=profiles
   * Form data: file (required)
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
      },
      fileFilter: (req, file, cb) => {
        // Allowed MIME types
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'application/pdf',
          'video/mp4',
          'video/webm',
          'audio/mpeg',
          'audio/wav',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(`File type ${file.mimetype} not allowed`),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const directory = req.query.directory || 'general';
    const userId = req.user.id;

    // Store file with user-based directory structure
    const userDirectory = `${directory}/${userId}`;

    try {
      const { url, key } = await this.storageService.upload(
        file,
        userDirectory,
      );

      return {
        success: true,
        data: {
          url,
          key,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Profile photo upload endpoint
   * POST /api/upload/profile-photo
   * Form data: file (required, image only)
   */
  @Post('profile-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for profile photos
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only JPEG, PNG, and WebP images allowed for profile photos',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user.id;
    const userDirectory = `profiles/${userId}`;

    try {
      const { url, key } = await this.storageService.upload(
        file,
        userDirectory,
      );

      return {
        success: true,
        data: {
          url,
          key,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Cover photo upload endpoint
   * POST /api/upload/cover-photo
   * Form data: file (required, image only)
   */
  @Post('cover-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for cover photos
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only JPEG, PNG, and WebP images allowed for cover photos',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadCoverPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user.id;
    const userDirectory = `covers/${userId}`;

    try {
      const { url, key } = await this.storageService.upload(
        file,
        userDirectory,
      );

      return {
        success: true,
        data: {
          url,
          key,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Marketplace image upload endpoint
   * POST /api/upload/marketplace
   * Form data: file (required, image only)
   */
  @Post('marketplace')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for marketplace images
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Only image files allowed for marketplace'),
            false,
          );
        }
      },
    }),
  )
  async uploadMarketplaceImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user.id;
    const userDirectory = `marketplace/${userId}`;

    try {
      const { url, key } = await this.storageService.upload(
        file,
        userDirectory,
      );

      return {
        success: true,
        data: {
          url,
          key,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }
}
