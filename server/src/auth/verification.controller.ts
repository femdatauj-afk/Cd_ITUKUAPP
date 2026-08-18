import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth/verify')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  /**
   * Submit a verification request
   * POST /auth/verify
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async submitVerification(
    @Req() req: any,
    @Body() body: { method?: string },
  ) {
    const method = body.method || 'document';

    return this.verificationService.submitVerificationRequest(req.user.id, method);
  }

  /**
   * Get current verification status
   * GET /auth/verify/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: any) {
    return this.verificationService.getVerificationStatus(req.user.id);
  }

  /**
   * Get verification audit trail for current user
   * GET /auth/verify/audit
   */
  @Get('audit')
  @UseGuards(JwtAuthGuard)
  async getAudit(@Req() req: any) {
    return this.verificationService.getVerificationAudit(req.user.id);
  }

  /**
   * Get verification audit trail for specific user (admin only)
   * GET /auth/verify/audit/:userId
   */
  @Get('audit/:userId')
  @UseGuards(JwtAuthGuard)
  async getAuditForUser(
    @Req() req: any,
    @Param('userId') userId: string,
  ) {
    // Only allow admins or the user viewing their own audit
    if (req.user.role !== 'admin' && req.user.role !== 'moderator' && req.user.id !== userId) {
      throw new BadRequestException('Unauthorized to view this audit trail');
    }

    return this.verificationService.getVerificationAudit(userId);
  }

  /**
   * Approve verification request (admin only)
   * PUT /auth/verify/:id/approve
   */
  @Put(':id/approve')
  @UseGuards(JwtAuthGuard)
  async approveVerification(
    @Req() req: any,
    @Param('id') verificationId: string,
    @Body() body: { reason?: string },
  ) {
    // Only allow admins
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      throw new BadRequestException('Only admins can approve verifications');
    }

    return this.verificationService.approveVerification(verificationId, req.user.id, body.reason);
  }

  /**
   * Reject verification request (admin only)
   * PUT /auth/verify/:id/reject
   */
  @Put(':id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectVerification(
    @Req() req: any,
    @Param('id') verificationId: string,
    @Body() body: { reason?: string },
  ) {
    // Only allow admins
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      throw new BadRequestException('Only admins can reject verifications');
    }

    if (!body.reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    return this.verificationService.rejectVerification(verificationId, req.user.id, body.reason);
  }

  /**
   * Get all pending verifications (admin only)
   * GET /auth/verify/pending
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard)
  async getPending(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // Only allow admins
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      throw new BadRequestException('Only admins can view pending verifications');
    }

    const limitNum = limit ? Math.min(parseInt(limit), 100) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;

    return this.verificationService.getPendingVerifications(limitNum, offsetNum);
  }

  /**
   * Bulk reject verifications (admin only)
   * PUT /auth/verify/bulk-reject
   */
  @Put('bulk-reject')
  @UseGuards(JwtAuthGuard)
  async bulkReject(
    @Req() req: any,
    @Body() body: { ids?: string[]; reason?: string },
  ) {
    // Only allow admins
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      throw new BadRequestException('Only admins can bulk reject verifications');
    }

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new BadRequestException('IDs array is required and must not be empty');
    }

    if (!body.reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    return this.verificationService.bulkRejectVerifications(body.ids, req.user.id, body.reason);
  }
}
