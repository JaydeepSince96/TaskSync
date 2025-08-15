// src/services/email-service.ts
import nodemailer from 'nodemailer';
import { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS, EMAIL_FROM_NAME } from '../configs/env';

// New environment variables for professional email services
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'TaskSync';

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL;

const AWS_SES_ACCESS_KEY_ID = process.env.AWS_SES_ACCESS_KEY_ID;
const AWS_SES_SECRET_ACCESS_KEY = process.env.AWS_SES_SECRET_ACCESS_KEY;
const AWS_SES_REGION = process.env.AWS_SES_REGION || 'us-east-1';
const AWS_SES_FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL;

interface TaskReminderData {
  task: any;
  user: any;
  daysUntilDue: number;
}

interface WeeklyReportData {
  user: any;
  stats: any;
  period: {
    startDate: Date;
    endDate: Date;
    weekNumber: number;
  };
  insights: string[];
}

type EmailProvider = 'sendgrid' | 'mailgun' | 'ses' | 'smtp' | 'none';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;
  private provider: EmailProvider = 'none';
  private fromEmail: string = '';
  private fromName: string = 'TaskSync';

  constructor() {
    this.initialize();
  }

  // Initialize email transporter with multiple provider support
  private initialize() {
    try {
      // Priority order: SendGrid > Mailgun > AWS SES > SMTP
      if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
        this.initializeSendGrid();
      } else if (MAILGUN_API_KEY && MAILGUN_DOMAIN && MAILGUN_FROM_EMAIL) {
        this.initializeMailgun();
      } else if (AWS_SES_ACCESS_KEY_ID && AWS_SES_SECRET_ACCESS_KEY && AWS_SES_FROM_EMAIL) {
        this.initializeAWSSES();
      } else if (EMAIL_USER && EMAIL_PASS) {
        this.initializeSMTP();
      } else {
        console.log('⚠️ No email provider credentials found. Email service will be disabled.');
        console.log('📧 Available providers: SendGrid, Mailgun, AWS SES, or SMTP');
        return;
      }

      this.isInitialized = true;
      console.log(`✅ Email service initialized successfully with ${this.provider}`);
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  private initializeSendGrid() {
    this.provider = 'sendgrid';
    this.fromEmail = SENDGRID_FROM_EMAIL!;
    this.fromName = SENDGRID_FROM_NAME;

    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: SENDGRID_API_KEY,
      },
    });
  }

  private initializeMailgun() {
    this.provider = 'mailgun';
    this.fromEmail = MAILGUN_FROM_EMAIL!;
    this.fromName = EMAIL_FROM_NAME;

    this.transporter = nodemailer.createTransport({
      host: `smtp.mailgun.org`,
      port: 587,
      secure: false,
      auth: {
        user: `postmaster@${MAILGUN_DOMAIN}`,
        pass: MAILGUN_API_KEY,
      },
    });
  }

  private initializeAWSSES() {
    this.provider = 'ses';
    this.fromEmail = AWS_SES_FROM_EMAIL!;
    this.fromName = EMAIL_FROM_NAME;

    this.transporter = nodemailer.createTransport({
      host: `email-smtp.${AWS_SES_REGION}.amazonaws.com`,
      port: 587,
      secure: false,
      auth: {
        user: AWS_SES_ACCESS_KEY_ID,
        pass: AWS_SES_SECRET_ACCESS_KEY,
      },
    });
  }

  private initializeSMTP() {
    this.provider = 'smtp';
    this.fromEmail = EMAIL_USER!; // Non-null assertion since we check in initialize()
    this.fromName = EMAIL_FROM_NAME;

    this.transporter = nodemailer.createTransport({
      host: EMAIL_HOST!,
      port: EMAIL_PORT!,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER!,
        pass: EMAIL_PASS!,
      },
    });
  }

  // Send task assignment notification email
  async sendTaskAssignmentNotification(data: { task: any; assignedUser: any; assignedBy: any }): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      console.log('⚠️ Email service not initialized');
      return false;
    }

    try {
      const { task, assignedUser, assignedBy } = data;

      const subject = `📋 New Task Assigned: "${task.title}"`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .task-card { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Task Assignment</h1>
              <p>You have been assigned a new task!</p>
            </div>
            <div class="content">
              <h2>Hello ${assignedUser.name || assignedUser.email}!</h2>
              <p><strong>${assignedBy.name || assignedBy.email}</strong> has assigned you a new task.</p>
              
              <div class="task-card">
                <h3>📝 ${task.title}</h3>
                <p><strong>Assigned by:</strong> ${assignedBy.name || assignedBy.email}</p>
                <p><strong>Start Date:</strong> ${new Date(task.startDate).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
                <p><strong>Priority:</strong> ${task.label || 'Normal'}</p>
                ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
              </div>

              <p>Please review the task details and start working on it as soon as possible.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://tasksync.org'}/dashboard" class="button">View Task in TaskSync</a>
              </div>
            </div>
            <div class="footer">
              <p>This email was sent by TaskSync - Your Personal Task Manager</p>
              <p>If you have any questions, please contact your team lead.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
New Task Assignment: ${task.title}

Hello ${assignedUser.name || assignedUser.email}!

${assignedBy.name || assignedBy.email} has assigned you a new task:

Task: ${task.title}
Assigned by: ${assignedBy.name || assignedBy.email}
Start Date: ${new Date(task.startDate).toLocaleDateString()}
Due Date: ${new Date(task.dueDate).toLocaleDateString()}
Priority: ${task.label || 'Normal'}
${task.description ? `Description: ${task.description}\n` : ''}

Please review the task details and start working on it as soon as possible.

Best regards,
TaskSync Team
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: assignedUser.email,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Task assignment notification email sent to ${assignedUser.email} via ${this.provider}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending task assignment notification email:', error);
      return false;
    }
  }

  // Send task reminder email
  async sendTaskReminder(data: TaskReminderData): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      console.log('⚠️ Email service not initialized');
      return false;
    }

    try {
      const { task, user, daysUntilDue } = data;

      const urgencyLevel = daysUntilDue === 0 ? 'urgent' : daysUntilDue === 1 ? 'important' : 'normal';
      const timeText = daysUntilDue === 0 ? 'today' : 
                      daysUntilDue === 1 ? 'tomorrow' : 
                      `in ${daysUntilDue} days`;

      const subject = `🔔 Task Reminder: "${task.title}" is due ${timeText}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .task-card { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .priority-${urgencyLevel} { border-left-color: ${urgencyLevel === 'urgent' ? '#dc3545' : urgencyLevel === 'important' ? '#ffc107' : '#28a745'}; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Task Reminder</h1>
              <p>Don't let important tasks slip away!</p>
            </div>
            <div class="content">
              <h2>Hello ${user.name || user.email}!</h2>
              <p>This is a friendly reminder about your upcoming task.</p>
              
              <div class="task-card priority-${urgencyLevel}">
                <h3>📝 ${task.title}</h3>
                <p><strong>Due:</strong> ${timeText}</p>
                <p><strong>Priority:</strong> ${task.label || 'Normal'}</p>
                ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
              </div>

              ${daysUntilDue === 0 ? 
                '<p style="color: #dc3545; font-weight: bold;">⚠️ This task is due today! Make sure to complete it before the deadline.</p>' :
                `<p>📅 You have ${daysUntilDue} day(s) to complete this task. Plan your time accordingly!</p>`
              }

              <p>Stay organized and keep up the great work!</p>
            </div>
            <div class="footer">
              <p>This email was sent by TaskSync - Your Personal Task Manager</p>
              <p>If you no longer wish to receive these reminders, please update your notification preferences.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Task Reminder: ${task.title}

Hello ${user.name || user.email}!

This is a reminder about your task:
- Task: ${task.title}
- Due: ${timeText}
- Priority: ${task.label || 'Normal'}

${daysUntilDue === 0 ? 
  'This task is due today! Make sure to complete it.' :
  `You have ${daysUntilDue} day(s) to complete this task.`
}

Best regards,
TaskSync Team
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Task reminder email sent to ${user.email} via ${this.provider}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending task reminder email:', error);
      return false;
    }
  }

  // Send weekly report email
  async sendWeeklyReport(data: WeeklyReportData): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      console.log('⚠️ Email service not initialized');
      return false;
    }

    try {
      const { user, stats, period, insights } = data;

      const completionRate = stats.totalTasks > 0 ? 
        Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

      const subject = `📊 Your Weekly Report - Week ${period.weekNumber} (${completionRate}% completion)`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
            .stat-number { font-size: 24px; font-weight: bold; color: #28a745; }
            .insights { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .progress-bar { width: 100%; height: 20px; background-color: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Report</h1>
              <p>Week ${period.weekNumber} Summary</p>
            </div>
            <div class="content">
              <h2>Hello ${user.name || user.email}!</h2>
              <p>Here's your productivity summary for this week:</p>
              
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${completionRate}%"></div>
              </div>
              <p style="text-align: center; margin: 0; font-weight: bold;">${completionRate}% Tasks Completed</p>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${stats.completedTasks}</div>
                  <div>Completed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.totalTasks}</div>
                  <div>Total Tasks</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number" style="color: #dc3545;">${stats.overdueTasks}</div>
                  <div>Overdue</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number" style="color: #ffc107;">${stats.pendingTasks || 0}</div>
                  <div>Pending</div>
                </div>
              </div>

              ${insights.length > 0 ? `
              <div class="insights">
                <h3>🎯 Key Insights:</h3>
                <ul>
                  ${insights.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
              </div>
              ` : ''}

              <p>${completionRate >= 80 ? 
                '🎉 Excellent work this week! You\'re crushing your goals!' :
                completionRate >= 60 ? 
                '👏 Good progress! Keep up the momentum!' :
                '💪 There\'s room for improvement. Let\'s focus on priorities next week!'
              }</p>
            </div>
            <div class="footer">
              <p>This weekly report was generated by TaskSync</p>
              <p>Keep up the great work and stay organized!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: subject,
        html: htmlContent
      });

      console.log(`✅ Weekly report email sent to ${user.email} via ${this.provider}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending weekly report email:', error);
      return false;
    }
  }

  // Send custom email
  async sendCustomEmail(email: string, subject: string, message: string): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      console.log('⚠️ Email service not initialized');
      return false;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TaskSync</h1>
              <p>Task Management Made Simple</p>
            </div>
            <div class="content">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <div class="footer">
              <p>This email was sent by TaskSync - Your Personal Task Manager</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: subject,
        html: htmlContent
      });

      console.log(`✅ Custom email sent to ${email} via ${this.provider}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending custom email:', error);
      return false;
    }
  }

  // Check if email service is available
  isAvailable(): boolean {
    return this.isInitialized && this.transporter !== null;
  }

  // Send invitation email
  async sendInvitationEmail(invitation: any, inviterName: string): Promise<void> {
    if (!this.isInitialized) {
      console.log('📧 Email service not initialized. Logging invitation details:');
      console.log(`To: ${invitation.email}`);
      console.log(`From: ${inviterName}`);
      console.log(`Token: ${invitation.token}`);
      console.log(`Expires: ${invitation.expiresAt}`);
      console.log(`Invite URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?token=${invitation.token}`);
      return;
    }

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?token=${invitation.token}`;
    
    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: invitation.email,
      subject: `${inviterName} invited you to join TaskSync`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0ea5e9; margin: 0;">TaskSync</h1>
            <p style="color: #666; margin: 5px 0;">Task Management Made Simple</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">You're Invited!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
              <strong>${inviterName}</strong> has invited you to join their team on TaskSync.
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
              TaskSync helps teams organize, assign, and track tasks efficiently. 
              Join now to start collaborating!
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${inviteUrl}" 
               style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Accept Invitation & Sign Up
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              This invitation will expire on <strong>${invitation.expiresAt.toLocaleDateString()}</strong>.
            </p>
            <p style="color: #64748b; font-size: 14px; margin: 10px 0 0 0;">
              If you can't click the button above, copy and paste this link into your browser:
            </p>
            <p style="color: #0ea5e9; font-size: 14px; word-break: break-all;">
              ${inviteUrl}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2025 TaskSync. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        ${inviterName} invited you to join TaskSync!
        
        You've been invited to join their team on TaskSync - a powerful task management platform.
        
        Click here to accept the invitation and sign up:
        ${inviteUrl}
        
        This invitation expires on ${invitation.expiresAt.toLocaleDateString()}.
        
        Best regards,
        The TaskSync Team
      `
    };

    try {
      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
        console.log(`✅ Invitation email sent to ${invitation.email} via ${this.provider}`);
      }
    } catch (error) {
      console.error('❌ Error sending invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  }

  // Send OTP email for registration
  async sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      console.log('⚠️ Email service not initialized');
      return false;
    }

    try {
      const subject = '🔐 Your TaskSync Verification Code';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .otp-box { background-color: #f8fafc; border: 2px dashed #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification</h1>
              <p>Complete your TaskSync registration</p>
            </div>
            <div class="content">
              <h2>Hello${name ? ` ${name}` : ''}!</h2>
              <p>Welcome to TaskSync! To complete your registration, please verify your email address using the verification code below:</p>
              
              <div class="otp-box">
                ${otp}
              </div>

              <p><strong>This verification code will expire in 15 minutes.</strong></p>
              
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>• Do not share this code with anyone</p>
                <p>• TaskSync will never ask for this code via phone or email</p>
                <p>• If you didn't request this verification, please ignore this email</p>
              </div>

              <p>Enter this code in the registration form to activate your account and start organizing your tasks!</p>
            </div>
            <div class="footer">
              <p>This email was sent by TaskSync - Your Personal Task Manager</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
TaskSync Email Verification

Hello${name ? ` ${name}` : ''}!

Welcome to TaskSync! To complete your registration, please verify your email address using this verification code:

Your Verification Code: ${otp}

This code will expire in 15 minutes.

SECURITY NOTICE:
- Do not share this code with anyone
- TaskSync will never ask for this code via phone or email
- If you didn't request this verification, please ignore this email

Enter this code in the registration form to activate your account.

Best regards,
TaskSync Team
      `;

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ OTP email sent to ${email} via ${this.provider}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      return false;
    }
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      provider: this.provider,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      hasCredentials: !!(SENDGRID_API_KEY || MAILGUN_API_KEY || AWS_SES_ACCESS_KEY_ID || (EMAIL_USER && EMAIL_PASS))
    };
  }
}
