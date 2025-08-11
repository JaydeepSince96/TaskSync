// src/services/email-validation-service.ts
import { FRONTEND_URL, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME } from '../configs/env';

interface EmailValidationResult {
  isValid: boolean;
  isDisposable: boolean;
  isRole: boolean;
  score: number;
  reason?: string;
}

export class EmailValidationService {
  private sendGridApiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.sendGridApiKey = SENDGRID_API_KEY;
    this.fromEmail = SENDGRID_FROM_EMAIL;
    this.fromName = SENDGRID_FROM_NAME;
  }

  /**
   * Validate email address using multiple methods
   */
  async validateEmail(email: string): Promise<EmailValidationResult> {
    try {
      // Basic regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          isValid: false,
          isDisposable: false,
          isRole: false,
          score: 0,
          reason: 'Invalid email format'
        };
      }

      // Check for disposable email domains
      const disposableDomains = [
        'tempmail.org', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
        'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'sharklasers.com',
        'getairmail.com', 'mailnesia.com', 'maildrop.cc', 'yopmail.com',
        'getnada.com', 'mailmetrash.com', 'trashmail.com', 'mailnull.com'
      ];

      const domain = email.split('@')[1]?.toLowerCase();
      const isDisposable = disposableDomains.indexOf(domain) !== -1;

      // Check for role-based emails
      const roleEmails = ['admin', 'info', 'support', 'help', 'contact', 'sales', 'noreply', 'no-reply'];
      const localPart = email.split('@')[0]?.toLowerCase();
      const isRole = roleEmails.indexOf(localPart) !== -1;

      // Calculate score (0-100)
      let score = 100;
      if (isDisposable) score -= 50;
      if (isRole) score -= 20;
      if (!domain || domain.length < 3) score -= 30;

      return {
        isValid: score > 50,
        isDisposable,
        isRole,
        score,
        reason: score <= 50 ? 'Email appears to be invalid or disposable' : undefined
      };
    } catch (error) {
      console.error('Email validation error:', error);
      return {
        isValid: false,
        isDisposable: false,
        isRole: false,
        score: 0,
        reason: 'Validation failed'
      };
    }
  }

  /**
   * Send invitation email using SendGrid
   */
  async sendInvitationEmail(invitationData: {
    toEmail: string;
    inviterName: string;
    invitationToken: string;
    workspaceName?: string;
  }): Promise<boolean> {
    try {
      const { toEmail, inviterName, invitationToken, workspaceName = 'TaskSync' } = invitationData;

      // Validate email first
      const validation = await this.validateEmail(toEmail);
      if (!validation.isValid) {
        throw new Error(`Invalid email address: ${validation.reason}`);
      }

      const invitationUrl = `${FRONTEND_URL || 'https://tasksync.org'}/register?token=${invitationToken}&email=${encodeURIComponent(toEmail)}`;

      // Using fetch instead of axios
      const emailData = {
        personalizations: [
          {
            to: [{ email: toEmail, name: toEmail.split('@')[0] }]
          }
        ],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `You're invited to join ${workspaceName} on TaskSync!`,
        content: [
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">You're Invited!</h2>
                <p>Hello,</p>
                <p><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on TaskSync.</p>
                <p>Click the button below to accept the invitation and create your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
                <p>This invitation will expire in 24 hours.</p>
                <p>Best regards,<br>The TaskSync Team</p>
              </div>
            `
          }
        ]
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.status === 202) {
        console.log(`✅ Invitation email sent successfully to ${toEmail}`);
        return true;
      } else {
        const errorData = await response.text();
        console.error(`❌ Failed to send invitation email to ${toEmail}:`, errorData);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Error sending invitation email to ${invitationData.toEmail}:`, error.message);
      return false;
    }
  }

  /**
   * Send OTP email using SendGrid
   */
  async sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
    try {
      // Validate email first
      const validation = await this.validateEmail(email);
      if (!validation.isValid) {
        throw new Error(`Invalid email address: ${validation.reason}`);
      }

      const emailData = {
        personalizations: [
          {
            to: [{ email, name: name || email.split('@')[0] }]
          }
        ],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `Your TaskSync Verification Code`,
        content: [
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Verify Your Email</h2>
                <p>Hello ${name || 'there'},</p>
                <p>Your verification code for TaskSync is:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 10px; padding: 20px; display: inline-block;">
                    <h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                  </div>
                </div>
                <p>Enter this code in the TaskSync app to complete your registration.</p>
                <p><strong>This code will expire in 15 minutes.</strong></p>
                <p>If you didn't request this code, please ignore this email.</p>
                <p>Best regards,<br>The TaskSync Team</p>
              </div>
            `
          }
        ]
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.status === 202) {
        console.log(`✅ OTP email sent successfully to ${email}`);
        return true;
      } else {
        const errorData = await response.text();
        console.error(`❌ Failed to send OTP email to ${email}:`, errorData);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Error sending OTP email to ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Check if email service is available
   */
  isAvailable(): boolean {
    // Temporarily disable SendGrid to prevent template errors
    return false; // !!this.sendGridApiKey && !!this.fromEmail;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      provider: 'sendgrid',
      isAvailable: this.isAvailable(),
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      hasApiKey: !!this.sendGridApiKey
    };
  }
}
