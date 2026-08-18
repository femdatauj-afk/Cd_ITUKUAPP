import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; username: string; password: string; fullName: string; village: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: { identifier: string; password: string }) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: { fullName?: string; username?: string; email?: string; village?: string; bio?: string; phone?: string }) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallet/fund')
  async addFunds(@Req() req: any, @Body() body: { amount: number }) {
    return this.authService.addFunds(req.user.id, body.amount || 0);
  }

  // Email verification endpoints
  @Post('send-verification-email')
  async sendVerificationEmail(@Body() body: { email: string }) {
    return this.authService.sendEmailVerification(body.email);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() body: { email: string }) {
    return this.authService.sendEmailVerification(body.email);
  }

  // OTP endpoints
  @UseGuards(JwtAuthGuard)
  @Post('request-otp')
  async requestOtp(@Req() req: any) {
    return this.authService.requestOtp(req.user.id);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { userId: string; code: string }) {
    return this.authService.verifyOtp(body.userId, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-phone')
  async verifyPhone(@Req() req: any, @Body() body: { code: string }) {
    return this.authService.verifyOtp(req.user.id, body.code);
  }

  // Password reset endpoints
  @Post('request-password-reset')
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
