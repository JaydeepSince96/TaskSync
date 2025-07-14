// src/services/email-service.ts
import nodemailer from 'nodemailer';
import { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS, EMAIL_FROM_NAME } from '../configs/env';

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

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  // Initialize email transporter
  private initialize() {
    try {
      if (!EMAIL_USER || !EMAIL_PASS) {
        console.log('⚠️ Email credentials not found. Email service will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_SECURE, // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });

      this.isInitialized = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
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
        from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
        to: user.email,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Task reminder email sent to ${user.email}`);
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
        from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
        to: user.email,
        subject: subject,
        html: htmlContent
      });

      console.log(`✅ Weekly report email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending weekly report email:', error);
      return false;
    }
  }

  // Test email service
  async sendTestEmail(email: string): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      console.log('⚠️ Email service not initialized');
      return false;
    }

    try {
      const testMessage = `
        <h2>📧 Email Service Test</h2>
        <p>This is a test email from your TaskSync notification system.</p>
        <p>✅ If you received this email, your email notifications are working correctly!</p>
        <p><em>Test sent at: ${new Date().toLocaleString()}</em></p>
      `;

      await this.transporter.sendMail({
        from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
        to: email,
        subject: '🧪 TaskSync Email Test',
        html: testMessage
      });

      console.log(`✅ Test email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      return false;
    }
  }

  // Check if email service is available
  isAvailable(): boolean {
    return this.isInitialized && this.transporter !== null;
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasCredentials: !!(EMAIL_USER && EMAIL_PASS),
      host: EMAIL_HOST,
      port: EMAIL_PORT
    };
  }
}

export default new EmailService();
