import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Submit a verification request for a user
   */
  async submitVerificationRequest(userId: string, verificationMethod: string) {
    this.logger.log(`Verification request submitted by user ${userId} using method: ${verificationMethod}`);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a pending verification
    const existingPending = await this.prisma.verificationAudit.findFirst({
      where: {
        userId,
        verificationStatus: 'pending',
      },
    });

    if (existingPending) {
      throw new BadRequestException('You already have a pending verification request');
    }

    // Create verification audit record
    const verificationAudit = await this.prisma.verificationAudit.create({
      data: {
        userId,
        verificationStatus: 'under_review',
        verificationMethod,
        createdAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        id: verificationAudit.id,
        status: verificationAudit.verificationStatus,
        method: verificationAudit.verificationMethod,
        submittedAt: verificationAudit.createdAt,
      },
    };
  }

  /**
   * Admin approve a verification request
   */
  async approveVerification(verificationId: string, adminId: string, reason?: string) {
    this.logger.log(`Verification ${verificationId} approved by admin ${adminId}`);

    // Check if admin exists and has admin role
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || (admin.role !== 'admin' && admin.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can approve verifications');
    }

    // Find verification request
    const verificationAudit = await this.prisma.verificationAudit.findUnique({
      where: { id: verificationId },
    });

    if (!verificationAudit) {
      throw new NotFoundException('Verification request not found');
    }

    if (verificationAudit.verificationStatus === 'approved') {
      throw new BadRequestException('This verification has already been approved');
    }

    if (verificationAudit.verificationStatus === 'rejected') {
      throw new BadRequestException('This verification has already been rejected');
    }

    // Update verification audit
    const updated = await this.prisma.verificationAudit.update({
      where: { id: verificationId },
      data: {
        verificationStatus: 'approved',
        approvedBy: adminId,
        approvalReason: reason,
        updatedAt: new Date(),
      },
    });

    // Update user's verification status
    await this.prisma.user.update({
      where: { id: verificationAudit.userId },
      data: {
        isVerified: true,
        verificationStatus: 'approved',
        verifiedBadge: 'ItukuApp Verified',
        lastVerificationAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.verificationStatus,
        approvedBy: updated.approvedBy,
        approvalReason: updated.approvalReason,
        approvedAt: updated.updatedAt,
      },
    };
  }

  /**
   * Admin reject a verification request
   */
  async rejectVerification(verificationId: string, adminId: string, reason: string) {
    this.logger.log(`Verification ${verificationId} rejected by admin ${adminId}`);

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    // Check if admin exists and has admin role
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || (admin.role !== 'admin' && admin.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can reject verifications');
    }

    // Find verification request
    const verificationAudit = await this.prisma.verificationAudit.findUnique({
      where: { id: verificationId },
    });

    if (!verificationAudit) {
      throw new NotFoundException('Verification request not found');
    }

    if (verificationAudit.verificationStatus === 'approved') {
      throw new BadRequestException('This verification has already been approved');
    }

    if (verificationAudit.verificationStatus === 'rejected') {
      throw new BadRequestException('This verification has already been rejected');
    }

    // Update verification audit
    const updated = await this.prisma.verificationAudit.update({
      where: { id: verificationId },
      data: {
        verificationStatus: 'rejected',
        approvedBy: adminId,
        rejectionReason: reason,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.verificationStatus,
        rejectedBy: updated.approvedBy,
        rejectionReason: updated.rejectionReason,
        rejectedAt: updated.updatedAt,
      },
    };
  }

  /**
   * Get verification audit trail for a user
   */
  async getVerificationAudit(userId: string) {
    this.logger.log(`Fetching verification audit for user ${userId}`);

    const audits = await this.prisma.verificationAudit.findMany({
      where: { userId },
      include: {
        approver: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: audits.map(audit => ({
        id: audit.id,
        status: audit.verificationStatus,
        method: audit.verificationMethod,
        approvedBy: audit.approver?.username,
        approvalReason: audit.approvalReason,
        rejectionReason: audit.rejectionReason,
        submittedAt: audit.createdAt,
        reviewedAt: audit.updatedAt,
      })),
    };
  }

  /**
   * Get current verification status for a user
   */
  async getVerificationStatus(userId: string) {
    this.logger.log(`Fetching verification status for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isVerified: true,
        verificationStatus: true,
        verifiedBadge: true,
        lastVerificationAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get latest verification request
    const latestAudit = await this.prisma.verificationAudit.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: {
        userId: user.id,
        isVerified: user.isVerified,
        status: user.verificationStatus,
        badge: user.verifiedBadge,
        lastVerificationAt: user.lastVerificationAt,
        latestRequest: latestAudit ? {
          id: latestAudit.id,
          status: latestAudit.verificationStatus,
          submittedAt: latestAudit.createdAt,
        } : null,
      },
    };
  }

  /**
   * Get all pending verification requests (admin endpoint)
   */
  async getPendingVerifications(limit: number = 50, offset: number = 0) {
    this.logger.log(`Fetching pending verifications (limit: ${limit}, offset: ${offset})`);

    const [verifications, total] = await Promise.all([
      this.prisma.verificationAudit.findMany({
        where: {
          verificationStatus: 'under_review',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.verificationAudit.count({
        where: { verificationStatus: 'under_review' },
      }),
    ]);

    return {
      success: true,
      data: verifications.map(v => ({
        id: v.id,
        user: v.user,
        method: v.verificationMethod,
        submittedAt: v.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Bulk reject verification requests (admin endpoint)
   */
  async bulkRejectVerifications(verificationIds: string[], adminId: string, reason: string) {
    this.logger.log(`Bulk rejecting ${verificationIds.length} verifications by admin ${adminId}`);

    // Check if admin exists
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || (admin.role !== 'admin' && admin.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can reject verifications');
    }

    const results: Array<{ id: string; status: string; message?: string }> = [];

    for (const id of verificationIds) {
      try {
        const audit = await this.prisma.verificationAudit.findUnique({
          where: { id },
        });

        if (!audit || audit.verificationStatus !== 'under_review') {
          results.push({ id, status: 'skipped', message: 'Not pending' });
          continue;
        }

        const updated = await this.prisma.verificationAudit.update({
          where: { id },
          data: {
            verificationStatus: 'rejected',
            approvedBy: adminId,
            rejectionReason: reason,
            updatedAt: new Date(),
          },
        });

        results.push({ id, status: 'rejected' });
      } catch (error) {
        this.logger.error(`Error rejecting verification ${id}:`, error);
        results.push({ id, status: 'error', message: error.message });
      }
    }

    return {
      success: true,
      data: results,
    };
  }
}
