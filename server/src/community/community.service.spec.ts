import { BadRequestException } from '@nestjs/common';
import { CommunityService } from './community.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CommunityService', () => {
  it('throws error when user wallet has insufficient funds for group creation', async () => {
    const prisma = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ balance: 10 }),
      },
    } as unknown as PrismaService;

    const service = new CommunityService(prisma);

    await expect(service.createGroup('user-1', 'Youth Forum')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws error when user wallet has insufficient funds for page creation', async () => {
    const prisma = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ balance: 20 }),
      },
    } as unknown as PrismaService;

    const service = new CommunityService(prisma);

    await expect(service.createPage('user-1', 'Business Page', 'Business')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws error when user wallet has insufficient funds for marketplace listing creation', async () => {
    const prisma = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ balance: 15 }),
      },
    } as unknown as PrismaService;

    const service = new CommunityService(prisma);

    await expect(
      service.createMarketplaceListing('user-1', {
        title: 'Fresh yam',
        description: 'Locally harvested yam',
        category: 'Food',
        condition: 'New',
        price: 2500,
        village: 'Amokolo',
        contactPreference: 'WhatsApp',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
