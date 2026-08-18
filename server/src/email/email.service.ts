import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
    
    const htmlContent = `
      <h1>Verify Your Email</h1>
      <p>Welcome to ItukuApp! Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>Or copy this link: ${verificationUrl}</p>
      <p>This link expires in 24 hours.</p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@itukuapp.com',
        to: email,
        subject: 'Verify Your ItukuApp Email',
        html: htmlContent,
      });
      this.logger.log(`Email verification sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email verification to ${email}:`, error);
      throw error;
    }
  }

  async sendOtpCode(email: string, otp: string): Promise<void> {
    const htmlContent = `
      <h1>Your One-Time Password</h1>
      <p>Your OTP code is: <strong>${otp}</strong></p>
      <p>This code expires in 5 minutes.</p>
      <p>Do not share this code with anyone.</p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@itukuapp.com',
        to: email,
        subject: 'Your ItukuApp OTP Code',
        html: htmlContent,
      });
      this.logger.log(`OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    
    const htmlContent = `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request a password reset, ignore this email.</p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@itukuapp.com',
        to: email,
        subject: 'Reset Your ItukuApp Password',
        html: htmlContent,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    const htmlContent = `
      <h1>Welcome to ItukuApp, ${fullName}!</h1>
      <p>We're excited to have you join our community.</p>
      <p>Explore the nine villages and connect with your community members.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@itukuapp.com',
        to: email,
        subject: 'Welcome to ItukuApp!',
        html: htmlContent,
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }
}
