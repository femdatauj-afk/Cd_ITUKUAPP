import { Controller, Get, Post, Patch, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Get('status/:userId')
  async getModerationStatus(@Param('userId') userId: string) {
    return this.moderationService.getModerationStatus(userId);
  }

  @Get('actions')
  async listModerationActions() {
    return this.moderationService.listModerationActions({ isActive: true });
  }

  @Post('action')
  async createModerationAction(
    @Body()
    body: {
      userId: string;
      action: 'warning' | 'mute' | 'suspend' | 'ban';
      reason: string;
      durationHours?: number;
    },
  ) {
    if (!body.userId || !body.action || !body.reason) {
      throw new HttpException(
        'userId, action, and reason are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.moderationService.createModerationAction(
      body.userId,
      body.action,
      body.reason,
      body.durationHours,
    );
  }

  @Patch('action/:id/resolve')
  async resolveModerationAction(@Param('id') actionId: string) {
    return this.moderationService.resolveModerationAction(actionId);
  }
}
