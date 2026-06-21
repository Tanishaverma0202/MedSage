import nodemailer from 'nodemailer';
import { logger } from './database.service';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Helps with some network environments
  }
});

export class EmailService {
  /**
   * Send OTP verification email
   */
  async sendOTPEmail(to: string, otp: string): Promise<void> {
    
    console.log('SMTP DEBUG:', {
    user: process.env.SMTP_USER,
    passExists: !!process.env.SMTP_PASS
  });

    
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: 'MedSage - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #0d9488; margin-bottom: 20px;">Verify Your Email</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for signing up with MedSage! Please use the verification code below to verify your email address:
            </p>
            <div style="background: #f0fdfa; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; color: #0d9488; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              MedSage - Your Personal Health Companion
            </p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`OTP email sent to ${to}`);
    } catch (error) {
      console.error('❌ EMAIL ERROR FULL:', error);
      throw error;
    }
  }

  /**
   * Send Password Reset OTP email
   */
  async sendPasswordResetEmail(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: 'MedSage - Reset Password Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #0d9488; margin-bottom: 20px;">Reset Your Password</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              We received a request to reset your MedSage password. Please use the verification code below to reset your password:
            </p>
            <div style="background: #f0fdfa; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; color: #0d9488; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in <strong>10 minutes</strong>. If you didn't request a password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              MedSage - Your Personal Health Companion
            </p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Password reset OTP email sent to ${to}`);
    } catch (error) {
      console.error('❌ EMAIL ERROR FULL:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email service not configured:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
