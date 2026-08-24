import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private buildJwtPayload(user: { id: string; email: string; role?: string }) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role ?? 'member',
    };
  }

  async onModuleInit() {
    try {
      await this.runAutoVerificationSweep();
    } catch (error) {
      console.warn(
        'Auto verification sweep failed (database may not be initialized yet):',
        error.message,
      );
    }
  }

  async register(input: {
    email: string;
    username: string;
    password: string;
    fullName: string;
    village: string;
    phone?: string;
    verificationMethod?: 'email' | 'phone';
  }) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim().replace(/\s+/g, '-');
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existing) {
      throw new ConflictException(
        'A user with that email or username already exists.',
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        fullName: input.fullName.trim(),
        village: input.village.trim() || 'Umukulu',
        phone: input.phone?.trim() || null,
        role: 'member',
        isActive: false,
        verificationStatus: 'pending',
        emailVerified: false,
        phoneVerified: false,
        isVerified: false,
        verificationMethod:
          input.verificationMethod || (input.phone ? 'phone' : 'email'),
        verifiedBadge: 'Pending Verification',
        usernameUpdatedAt: new Date(),
        accountExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    });

    const communityTargets = await this.prisma.user.findMany({
      where: {
        OR: [
          { role: 'developer' },
          { role: 'moderator' },
          { role: 'admin' },
          { email: 'henry4683328@gmail.com' },
          { username: 'Henry-Of-Ituku' },
        ],
        NOT: { id: user.id },
      },
      select: { id: true },
      take: 20,
    });

    for (const target of communityTargets) {
      const followModel = (this.prisma as any).follow;
      const alreadyFollowing = followModel?.findFirst
        ? await followModel.findFirst({
            where: {
              followerId: user.id,
              followedId: target.id,
            },
          })
        : null;

      if (!alreadyFollowing && followModel?.create) {
        await followModel.create({
          data: {
            followerId: user.id,
            followedId: target.id,
          },
        });
      }
    }

    try {
      await this.emailService.sendWelcomeEmail(email, input.fullName.trim());
    } catch (error) {
      // keep registration successful even if the mail transport is unavailable
    }

    const token = this.jwtService.sign(this.buildJwtPayload(user));
    return { token, user: this.sanitizeUser(user) };
  }

  async login(input: { identifier: string; password: string }) {
    const identifier = input.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isActive && user.verificationStatus !== 'active') {
      throw new UnauthorizedException(
        'Your account is pending verification. Admin approval is required before login.',
      );
    }

    const token = this.jwtService.sign(this.buildJwtPayload(user));
    return { token, user: this.sanitizeUser(user) };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) throw new UnauthorizedException('User not found.');
    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      username?: string;
      email?: string;
      village?: string;
      bio?: string;
      phone?: string;
    },
  ) {
    if (data.email) {
      const emailOwner = await this.prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId },
        },
      });
      if (emailOwner) {
        throw new ConflictException('A user with that email already exists.');
      }
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!currentUser) {
      throw new UnauthorizedException('User not found.');
    }

    if (data.username) {
      const parsedUsername = data.username.trim().replace(/\s+/g, '-');
      const usernameOwner = await this.prisma.user.findFirst({
        where: {
          username: parsedUsername,
          NOT: { id: userId },
        },
      });
      if (usernameOwner) {
        throw new ConflictException(
          'A user with that username already exists.',
        );
      }

      const lastChange = currentUser.usernameUpdatedAt
        ? new Date(currentUser.usernameUpdatedAt)
        : null;
      if (
        lastChange &&
        Date.now() - lastChange.getTime() < 30 * 24 * 60 * 60 * 1000
      ) {
        throw new BadRequestException(
          'Username can only be changed once every 30 days.',
        );
      }

      data.username = parsedUsername;
      data = { ...data, usernameUpdatedAt: new Date() } as typeof data & {
        usernameUpdatedAt?: Date;
      };
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        fullName: data.fullName?.trim(),
        village: data.village?.trim(),
        bio: data.bio?.trim(),
        phone: data.phone?.trim() || null,
      },
      include: { wallet: true },
    });
    return this.sanitizeUser(user);
  }

  async addFunds(userId: string, amount: number) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount },
    });
    return wallet;
  }

  // Email verification
  async sendEmailVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // Generate verification token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send verification email
    await this.emailService.sendEmailVerification(email, token);
  }

  async verifyEmail(token: string): Promise<{ user: any }> {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    const user = await this.prisma.user.update({
      where: { id: verification.userId },
      data: {
        emailVerified: true,
        verificationMethod: 'email',
      },
      include: { wallet: true },
    });

    await this.prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    const refreshedUser = await this.prisma.user.findUnique({
      where: { id: verification.userId },
    });
    if (refreshedUser) {
      const nextStatus = this.calculateVerificationState(refreshedUser);
      await this.prisma.user.update({
        where: { id: verification.userId },
        data: nextStatus,
      });
    }

    const finalUser = await this.prisma.user.findUnique({
      where: { id: verification.userId },
      include: { wallet: true },
    });
    if (!finalUser) {
      throw new UnauthorizedException('User not found after verification.');
    }
    return { user: this.sanitizeUser(finalUser) };
  }

  // OTP functionality
  async requestOtp(userId: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Clean up old OTPs
    await this.prisma.oTP.deleteMany({
      where: {
        userId,
        usedAt: null,
        expiresAt: { lt: new Date() },
      },
    });

    await this.prisma.oTP.create({
      data: {
        userId,
        code: otp,
        expiresAt,
      },
    });

    // Send OTP email
    await this.emailService.sendOtpCode(user.email, otp);

    return { success: true };
  }

  async verifyOtp(userId: string, code: string): Promise<{ token: string }> {
    const otp = await this.prisma.oTP.findFirst({
      where: {
        userId,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    await this.prisma.oTP.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const nextUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...this.calculateVerificationState({
          ...user,
          phoneVerified: true,
          emailVerified: Boolean(user.emailVerified),
          isVerified: true,
          isActive: true,
          verificationStatus: 'active',
          verifiedBadge: 'ItukuApp Verified',
          lastVerificationAt: new Date(),
        }),
        verificationMethod: 'phone',
      },
    });

    const token = this.jwtService.sign({
      sub: nextUser.id,
      email: nextUser.email,
    });
    return { token };
  }

  // Password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // Generate reset token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clean up old reset tokens
    await this.prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email
    await this.emailService.sendPasswordReset(email, token);

    return { success: true };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const resetToken = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
      throw new BadRequestException(
        'Invalid, expired, or already used reset token.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await this.prisma.passwordReset.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    return { success: true };
  }

  async runAutoVerificationSweep(): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { verificationStatus: { in: ['pending', 'review'] } },
          { isActive: false },
          { isVerified: false },
        ],
      },
    });

    let processed = 0;

    for (const user of users) {
      const hasVerifiedMethod = Boolean(
        user.emailVerified || user.phoneVerified || user.isVerified,
      );
      const accountExpired = Boolean(
        user.accountExpiresAt && new Date(user.accountExpiresAt) <= new Date(),
      );

      if (!hasVerifiedMethod && accountExpired) {
        await this.prisma.user.delete({ where: { id: user.id } });
        continue;
      }

      if (hasVerifiedMethod && !user.isVerified) {
        const nextState = this.calculateVerificationState({
          ...user,
          emailVerified: Boolean(user.emailVerified),
          phoneVerified: Boolean(user.phoneVerified),
          isVerified: true,
          isActive: true,
          verificationStatus: 'active',
          verifiedBadge: 'ItukuApp Verified',
          lastVerificationAt: new Date(),
        });

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...nextState,
            lastVerificationAt: new Date(),
            verificationStatus: 'active',
            verifiedBadge: 'ItukuApp Verified',
            isVerified: true,
            isActive: true,
          },
        });
        processed += 1;
      }
    }

    return processed;
  }

  private calculateVerificationState(user: Record<string, any>) {
    const hasVerifiedMethod = Boolean(
      user.emailVerified || user.phoneVerified || user.isVerified,
    );
    const isVerified = hasVerifiedMethod;
    const isActive = Boolean(user.isActive) || isVerified;
    return {
      emailVerified: Boolean(user.emailVerified),
      phoneVerified: Boolean(user.phoneVerified),
      isVerified,
      isActive,
      verificationStatus: isVerified
        ? 'active'
        : user.verificationStatus || 'pending',
      verifiedBadge: isVerified ? 'ItukuApp Verified' : 'Pending Verification',
      lastVerificationAt: isVerified ? new Date() : user.lastVerificationAt,
    };
  }

  private sanitizeUser(user: Record<string, any> | null) {
    if (!user) {
      return null;
    }
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
