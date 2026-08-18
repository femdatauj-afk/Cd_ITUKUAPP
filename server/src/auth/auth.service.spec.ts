import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  it('registers a new user and returns a token', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'ada@example.com',
          username: 'ada',
          fullName: 'Ada Lovelace',
          village: 'Ituku',
          role: 'member',
        }),
      },
      wallet: {
        create: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
      },
    } as unknown as PrismaService;

    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as unknown as JwtService;

    const service = new AuthService(prisma, jwtService);

    const result = await service.register({
      email: 'ada@example.com',
      username: 'ada',
      password: 'Password123',
      fullName: 'Ada Lovelace',
      village: 'Ituku',
    });

    expect(result.token).toBe('signed-token');
    expect(result.user.email).toBe('ada@example.com');
  });

  it('auto-follows the developer and sends a welcome email after registration', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'developer-1', email: 'henry4683328@gmail.com', username: 'Henry-Of-Ituku', role: 'developer' }),
        findMany: jest.fn().mockResolvedValue([{ id: 'developer-1' }]),
        create: jest.fn().mockResolvedValue({
          id: 'user-2',
          email: 'new.user@example.com',
          username: 'new-user',
          fullName: 'New User',
          village: 'Umukulu',
          role: 'member',
          isActive: false,
          verificationStatus: 'pending',
          emailVerified: false,
          phoneVerified: false,
          isVerified: false,
          verificationMethod: 'email',
          verifiedBadge: 'Pending Verification',
          usernameUpdatedAt: new Date(),
          accountExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
      },
      wallet: {
        create: jest.fn().mockResolvedValue({ id: 'wallet-2' }),
      },
      follow: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'follow-1' }),
      },
    } as unknown as PrismaService;

    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as unknown as JwtService;

    const emailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
      sendEmailVerification: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new AuthService(prisma, jwtService, emailService);

    const result = await service.register({
      email: 'new.user@example.com',
      username: 'new-user',
      password: 'Password123',
      fullName: 'New User',
      village: 'Umukulu',
    });

    expect(prisma.follow.create).toHaveBeenCalledWith({
      data: {
        followerId: 'user-2',
        followedId: 'developer-1',
      },
    });
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('new.user@example.com', 'New User');
    expect(result.token).toBe('signed-token');
  });

  it('updates profile details including username and email', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'chinedu@itukuapp.com',
          username: 'chinedu',
          fullName: 'Chinedu Ujam',
          village: 'Umukulu',
          bio: 'Initial bio',
          phone: '+2348000000000',
          wallet: { balance: 120 },
          usernameUpdatedAt: null,
          verificationStatus: 'active',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'chinedu@itukuapp.com',
          username: 'chinedu110',
          fullName: 'Chinedu Ujam',
          village: 'Umukulu',
          bio: 'New bio',
          phone: '+2348000000000',
          wallet: { balance: 120 },
          usernameUpdatedAt: new Date(),
          verificationStatus: 'active',
        }),
      },
    } as unknown as PrismaService;

    const jwtService = {
      sign: jest.fn(),
    } as unknown as JwtService;

    const service = new AuthService(prisma, jwtService);

    const result = await service.updateProfile('user-1', {
      fullName: 'Chinedu Ujam',
      username: 'chinedu110',
      email: 'chinedu@itukuapp.com',
      phone: '+2348000000000',
      village: 'Umukulu',
      bio: 'New bio',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        fullName: 'Chinedu Ujam',
        username: 'chinedu110',
        email: 'chinedu@itukuapp.com',
        phone: '+2348000000000',
        village: 'Umukulu',
        bio: 'New bio',
      }),
    }));
    expect(result.email).toBe('chinedu@itukuapp.com');
    expect(result.username).toBe('chinedu110');
  });

  it('blocks a username change before 30 days have elapsed', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'henry@itukuapp.com',
          username: 'henry-legacy',
          usernameUpdatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          verificationStatus: 'active',
        }),
      },
    } as unknown as PrismaService;

    const jwtService = {
      sign: jest.fn(),
    } as unknown as JwtService;

    const service = new AuthService(prisma, jwtService);

    await expect(service.updateProfile('user-1', { username: 'henry-new' })).rejects.toThrow('Username can only be changed once every 30 days');
  });

  it('marks a user as phone-verified and active when OTP succeeds', async () => {
    const prisma = {
      oTP: {
        findFirst: jest.fn().mockResolvedValue({ id: 'otp-1', userId: 'user-1', code: '123456', expiresAt: new Date(Date.now() + 60_000) }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'ada@example.com',
          phone: '+2348000000000',
          phoneVerified: false,
          emailVerified: false,
          isVerified: false,
          isActive: false,
          verificationStatus: 'pending',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'ada@example.com',
          phone: '+2348000000000',
          phoneVerified: true,
          emailVerified: false,
          isVerified: true,
          isActive: true,
          verificationStatus: 'active',
        }),
      },
    } as unknown as PrismaService;

    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as unknown as JwtService;

    const service = new AuthService(prisma, jwtService);
    const result = await service.verifyOtp('user-1', '123456');

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        phoneVerified: true,
        isVerified: true,
        isActive: true,
        verificationStatus: 'active',
      }),
    }));
    expect(result.token).toBe('signed-token');
  });

  it('auto-verifies eligible users and removes expired unverified accounts', async () => {
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'user-2',
            emailVerified: true,
            phoneVerified: true,
            isVerified: false,
            isActive: false,
            verificationStatus: 'pending',
            accountExpiresAt: new Date(Date.now() - 1000),
          },
          {
            id: 'user-3',
            emailVerified: true,
            phoneVerified: false,
            isVerified: false,
            isActive: false,
            verificationStatus: 'pending',
            accountExpiresAt: new Date(Date.now() + 1000),
          },
          {
            id: 'user-4',
            emailVerified: false,
            phoneVerified: false,
            isVerified: false,
            isActive: false,
            verificationStatus: 'pending',
            accountExpiresAt: new Date(Date.now() - 1000),
          },
        ]),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;

    const jwtService = {
      sign: jest.fn(),
    } as unknown as JwtService;

    const service = new AuthService(prisma, jwtService);

    const result = await service.runAutoVerificationSweep();

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-2' },
      data: expect.objectContaining({
        isVerified: true,
        isActive: true,
        verificationStatus: 'active',
        verifiedBadge: 'ItukuApp Verified',
      }),
    }));
    expect(prisma.user.delete).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-4' },
    }));
    expect(result).toBe(2);
  });
});
