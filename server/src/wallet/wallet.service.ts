import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  // Send coins to another user
  async sendCoins(senderId: string, receiverId: string, amount: number) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send coins to yourself.');
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0.');
    }

    // Get sender wallet
    const senderWallet = await this.prisma.wallet.findUnique({
      where: { userId: senderId },
    });

    if (!senderWallet) {
      throw new NotFoundException('Sender wallet not found.');
    }

    if (senderWallet.balance < amount) {
      throw new BadRequestException('Insufficient balance.');
    }

    // Get receiver
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found.');
    }

    // Create transaction
    const transaction = await this.prisma.coinTransaction.create({
      data: {
        senderId,
        receiverId,
        amount,
        status: 'completed',
      },
    });

    // Update wallets
    await this.prisma.wallet.update({
      where: { userId: senderId },
      data: { balance: { decrement: amount } },
    });

    await this.prisma.wallet.update({
      where: { userId: receiverId },
      data: { balance: { increment: amount } },
    });

    return {
      success: true,
      transaction,
      senderBalance: senderWallet.balance - amount,
    };
  }

  // Request withdrawal
  async requestWithdrawal(
    userId: string,
    amount: number,
    bankAccount: string,
    accountHolderName?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0.');
    }

    if (!bankAccount || !bankAccount.trim()) {
      throw new BadRequestException('Bank account is required.');
    }

    // Get user wallet
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance for withdrawal.');
    }

    // Create withdrawal request
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        amount,
        bankAccount: bankAccount.trim(),
        status: 'pending',
      },
    });

    // Deduct from balance (pending)
    await this.prisma.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });

    return {
      success: true,
      withdrawal,
      remainingBalance: wallet.balance - amount,
    };
  }

  // Admin: approve withdrawal
  async approveWithdrawal(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found.');
    }

    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Withdrawal is not pending.');
    }

    const updated = await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'completed' },
    });

    return { success: true, withdrawal: updated };
  }

  // Admin: reject withdrawal
  async rejectWithdrawal(withdrawalId: string, reason: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found.');
    }

    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Withdrawal is not pending.');
    }

    // Refund coins to user
    await this.prisma.wallet.update({
      where: { userId: withdrawal.userId },
      data: { balance: { increment: withdrawal.amount } },
    });

    const updated = await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'failed',
        failureReason: reason,
      },
    });

    return { success: true, withdrawal: updated };
  }

  // Get withdrawal by ID
  async getWithdrawal(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found.');
    }

    return withdrawal;
  }

  // Get user withdrawals
  async getUserWithdrawals(userId: string, limit: number = 20, offset: number = 0) {
    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return withdrawals;
  }

  // Get pending withdrawals (admin)
  async getPendingWithdrawals(limit: number = 50, offset: number = 0) {
    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { status: 'pending' },
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
    });

    return withdrawals;
  }

  // Get transaction history
  async getTransactionHistory(userId: string, limit: number = 50, offset: number = 0) {
    const transactions = await this.prisma.coinTransaction.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return transactions.map((t) => ({
      ...t,
      type: t.senderId === userId ? 'sent' : 'received',
    }));
  }

  // Get wallet balance
  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }

    return { balance: wallet.balance };
  }

  // Add coins to wallet (admin)
  async addCoins(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0.');
    }

    const wallet = await this.prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });

    return { success: true, newBalance: wallet.balance };
  }

  async applyModerationAction(
    adminId: string,
    targetUserId: string,
    payload: {
      entityType: 'group' | 'community' | 'page';
      entityName: string;
      action: 'fine' | 'suspend' | 'ban';
      amountCoins: number;
      durationLabel: string;
      reason: string;
    },
  ) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    const adminUser = await this.prisma.user.findUnique({ where: { id: adminId } });

    if (!targetUser) {
      throw new NotFoundException('Target user not found.');
    }

    if (!adminUser) {
      throw new NotFoundException('Admin user not found.');
    }

    const amount = Math.max(0, Number(payload.amountCoins || 0));
    const normalizedAction = payload.action || 'fine';

    if (normalizedAction === 'fine') {
      if (amount > 0) {
        const wallet = await this.prisma.wallet.upsert({
          where: { userId: targetUserId },
          update: {},
          create: { userId: targetUserId, balance: 0 },
        });

        if (wallet.balance < amount) {
          throw new BadRequestException('Target user does not have enough coins to pay the fine.');
        }

        await this.prisma.wallet.update({
          where: { userId: targetUserId },
          data: { balance: { decrement: amount } },
        });
      }

      await this.prisma.coinTransaction.create({
        data: {
          senderId: targetUserId,
          receiverId: adminId,
          amount,
          type: 'fine',
          status: amount > 0 ? 'completed' : 'pending',
        },
      });
    }

    if (normalizedAction === 'suspend') {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: {
          isActive: false,
          verificationStatus: 'suspended',
        },
      });
    }

    if (normalizedAction === 'ban') {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: {
          isActive: false,
          verificationStatus: 'banned',
        },
      });
    }

    const message = normalizedAction === 'fine'
      ? `${adminUser.fullName} has fined you ${amount} ItukuApp coins in ${payload.entityName}. Pay the fine to lift the restriction.`
      : normalizedAction === 'suspend'
        ? `${adminUser.fullName} has suspended your access in ${payload.entityName} for ${payload.durationLabel}.`
        : `${adminUser.fullName} has banned your access from ${payload.entityName} for the stated violation.`;

    await this.prisma.message.create({
      data: {
        senderId: adminId,
        receiverId: targetUserId,
        content: message,
        type: 'SYSTEM',
      },
    });

    return {
      success: true,
      action: normalizedAction,
      amountCoins: amount,
      durationLabel: payload.durationLabel,
      entityType: payload.entityType,
      entityName: payload.entityName,
      reason: payload.reason,
      targetUser: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        username: targetUser.username,
        verificationStatus: normalizedAction === 'ban' ? 'banned' : normalizedAction === 'suspend' ? 'suspended' : targetUser.verificationStatus,
      },
    };
  }

  async payFine(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Fine amount must be greater than 0.');
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance to pay the fine.');
    }

    const updatedWallet = await this.prisma.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        verificationStatus: 'active',
      },
    });

    const latestMessages = await this.prisma.message.findMany({
      where: { receiverId: userId, type: 'SYSTEM' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (latestMessages[0]) {
      await this.prisma.message.create({
        data: {
          senderId: userId,
          receiverId: userId,
          content: `Your fine of ${amount} coins has been paid successfully. Your access has been restored and the restriction is now lifted.`,
          type: 'SYSTEM',
        },
      });
    }

    return {
      success: true,
      remainingBalance: updatedWallet.balance,
      paidAmount: amount,
    };
  }

  // Get all transactions (admin)
  async getAllTransactions(limit: number = 100, offset: number = 0) {
    const transactions = await this.prisma.coinTransaction.findMany({
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return transactions;
  }
}
