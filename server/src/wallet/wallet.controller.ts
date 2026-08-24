import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // Get wallet balance
  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@Req() req: Request & { user: { id: string } }) {
    return this.walletService.getBalance(req.user.id);
  }

  // Send coins to another user
  @UseGuards(JwtAuthGuard)
  @Post('send-coins')
  async sendCoins(
    @Req() req: Request & { user: { id: string } },
    @Body() body: { receiverId: string; amount: number },
  ) {
    return this.walletService.sendCoins(
      req.user.id,
      body.receiverId,
      body.amount,
    );
  }

  // Request withdrawal
  @UseGuards(JwtAuthGuard)
  @Post('request-withdrawal')
  async requestWithdrawal(
    @Req() req: Request & { user: { id: string } },
    @Body()
    body: {
      amount: number;
      bankAccount?: string;
      bankAccountId?: string;
      accountHolderName?: string;
    },
  ) {
    const bankAccount = body.bankAccount || body.bankAccountId || '';

    return this.walletService.requestWithdrawal(
      req.user.id,
      body.amount,
      bankAccount,
      body.accountHolderName,
    );
  }

  // Get user withdrawal requests
  @UseGuards(JwtAuthGuard)
  @Get('withdrawals')
  async getUserWithdrawals(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getUserWithdrawals(
      req.user.id,
      Number(limit || 20),
      Number(offset || 0),
    );
  }

  // Get withdrawal status
  @UseGuards(JwtAuthGuard)
  @Get('withdrawals/:withdrawalId')
  async getWithdrawal(@Param('withdrawalId') withdrawalId: string) {
    return this.walletService.getWithdrawal(withdrawalId);
  }

  // Get transaction history
  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getTransactionHistory(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getTransactionHistory(
      req.user.id,
      Number(limit || 50),
      Number(offset || 0),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('ledger')
  async getWalletLedger(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getWalletLedger(
      req.user.id,
      Number(limit || 50),
      Number(offset || 0),
    );
  }

  // Admin: approve withdrawal
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'developer')
  @Post('admin/withdrawals/:withdrawalId/approve')
  async approveWithdrawal(@Param('withdrawalId') withdrawalId: string) {
    return this.walletService.approveWithdrawal(withdrawalId);
  }

  // Admin: reject withdrawal
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'developer')
  @Post('admin/withdrawals/:withdrawalId/reject')
  async rejectWithdrawal(
    @Param('withdrawalId') withdrawalId: string,
    @Body() body: { reason: string },
  ) {
    return this.walletService.rejectWithdrawal(withdrawalId, body.reason);
  }

  // Admin: get pending withdrawals
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'developer', 'moderator')
  @Get('admin/withdrawals/pending')
  async getPendingWithdrawals(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getPendingWithdrawals(
      Number(limit || 50),
      Number(offset || 0),
    );
  }

  // Admin: add coins to user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'developer')
  @Post('admin/add-coins/:userId')
  async addCoins(
    @Param('userId') userId: string,
    @Body() body: { amount: number },
  ) {
    return this.walletService.addCoins(userId, body.amount);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'developer', 'moderator')
  @Post('admin/moderate')
  async applyModerationAction(
    @Req() req: Request & { user: { id: string } },
    @Body()
    body: {
      targetUserId: string;
      entityType: 'group' | 'community' | 'page';
      entityName: string;
      action: 'fine' | 'suspend' | 'ban';
      amountCoins: number;
      durationLabel: string;
      reason: string;
    },
  ) {
    return this.walletService.applyModerationAction(
      req.user.id,
      body.targetUserId,
      body,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('pay-fine')
  async payFine(
    @Req() req: Request & { user: { id: string } },
    @Body() body: { amount: number },
  ) {
    return this.walletService.payFine(req.user.id, body.amount);
  }

  // Admin: get all transactions
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'developer')
  @Get('admin/transactions')
  async getAllTransactions(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getAllTransactions(
      Number(limit || 100),
      Number(offset || 0),
    );
  }
}
