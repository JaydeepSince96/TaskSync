// src/services/otp-service.ts
import crypto from 'crypto';
import { OTP, IOTP } from '../models/otp-model';
import { EmailService } from './email-service';

interface OTPServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class OTPService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // Generate a 6-digit OTP
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Send OTP for registration
  async sendRegistrationOTP(email: string, userData: { name: string; password: string; invitationToken?: string }): Promise<OTPServiceResponse> {
    try {
      // Check if email is already registered
      const { User } = require('../models/user-model');
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return {
          success: false,
          message: "Email is already registered. Please try logging in instead."
        };
      }

      // Clean up any existing OTPs for this email and type
      await OTP.deleteMany({ email, type: 'registration' });

      // Generate new OTP
      const otpCode = this.generateOTP();

      // Create OTP record
      const otpRecord = new OTP({
        email,
        otp: otpCode,
        type: 'registration',
        userData: {
          name: userData.name,
          password: userData.password,
          invitationToken: userData.invitationToken
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      });

      await otpRecord.save();

      // Send OTP email using EmailService
      const emailSent = await this.emailService.sendOTPEmail(email, otpCode, userData.name);

      if (!emailSent) {
        // Clean up OTP record if email failed
        await OTP.deleteOne({ _id: otpRecord._id });
        return {
          success: false,
          message: "Failed to send verification email. Please check your email address or try again later."
        };
      }

      return {
        success: true,
        message: "Verification code sent to your email. Please check your inbox and enter the 6-digit code.",
        data: {
          email,
          expiresIn: 15 // minutes
        }
      };
    } catch (error: any) {
      console.error('Error sending registration OTP:', error);
      return {
        success: false,
        message: "Failed to send verification code. Please try again."
      };
    }
  }

  // Verify OTP and complete registration
  async verifyRegistrationOTP(email: string, otp: string): Promise<OTPServiceResponse> {
    try {
      // Find OTP record
      const otpRecord = await OTP.findOne({
        email,
        type: 'registration',
        isUsed: false
      }).sort({ createdAt: -1 }); // Get the latest OTP

      if (!otpRecord) {
        return {
          success: false,
          message: "Invalid or expired verification code. Please request a new one."
        };
      }

      // Check if OTP is expired
      if (otpRecord.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return {
          success: false,
          message: "Verification code has expired. Please request a new one."
        };
      }

      // Increment attempt counter
      otpRecord.attempts += 1;

      // Check attempts limit
      if (otpRecord.attempts > 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return {
          success: false,
          message: "Too many incorrect attempts. Please request a new verification code."
        };
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        await otpRecord.save(); // Save incremented attempts
        return {
          success: false,
          message: `Incorrect verification code. ${6 - otpRecord.attempts} attempts remaining.`
        };
      }

      // OTP is valid - mark as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      // Return user data for registration
      return {
        success: true,
        message: "Email verified successfully!",
        data: {
          email: otpRecord.email,
          userData: otpRecord.userData
        }
      };
    } catch (error: any) {
      console.error('Error verifying registration OTP:', error);
      return {
        success: false,
        message: "Failed to verify code. Please try again."
      };
    }
  }

  // Resend OTP
  async resendRegistrationOTP(email: string): Promise<OTPServiceResponse> {
    try {
      // Find existing OTP record
      const existingOTP = await OTP.findOne({
        email,
        type: 'registration',
        isUsed: false
      }).sort({ createdAt: -1 });

      if (!existingOTP) {
        return {
          success: false,
          message: "No pending verification found. Please start the registration process again."
        };
      }

      // Check if we can resend (prevent spam)
      const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime();
      if (timeSinceLastOTP < 60 * 1000) { // 1 minute cooldown
        return {
          success: false,
          message: "Please wait 1 minute before requesting a new verification code."
        };
      }

      // Generate new OTP
      const newOTPCode = this.generateOTP();

      // Update existing record
      existingOTP.otp = newOTPCode;
      existingOTP.attempts = 0;
      existingOTP.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await existingOTP.save();

      // Send new OTP email using EmailService
      const emailSent = await this.emailService.sendOTPEmail(
        email, 
        newOTPCode, 
        existingOTP.userData?.name
      );

      if (!emailSent) {
        return {
          success: false,
          message: "Failed to resend verification email. Please try again."
        };
      }

      return {
        success: true,
        message: "New verification code sent to your email.",
        data: {
          email,
          expiresIn: 15 // minutes
        }
      };
    } catch (error: any) {
      console.error('Error resending registration OTP:', error);
      return {
        success: false,
        message: "Failed to resend verification code. Please try again."
      };
    }
  }

  // Clean up expired OTPs (can be called periodically)
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      const result = await OTP.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`🧹 Cleaned up ${result.deletedCount} expired OTP records`);
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  // Get OTP statistics (for monitoring)
  async getOTPStats(): Promise<any> {
    try {
      const stats = await OTP.aggregate([
        {
          $group: {
            _id: '$type',
            total: { $sum: 1 },
            used: { $sum: { $cond: ['$isUsed', 1, 0] } },
            expired: { 
              $sum: { 
                $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] 
              } 
            }
          }
        }
      ]);

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting OTP stats:', error);
      return {
        success: false,
        message: 'Failed to get OTP statistics'
      };
    }
  }
}
