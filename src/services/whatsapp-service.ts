// src/services/whatsapp-service.ts
import twilio from 'twilio';
import { IUser } from '../models/user-model';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } from '../configs/env';

interface TaskReminderData {
  task: any;
  user: IUser;
  daysUntilDue: number;
}

interface WeeklyReportData {
  user: IUser;
  stats: any;
  period: {
    startDate: Date;
    endDate: Date;
    weekNumber: number;
  };
  insights: string[];
}

class WhatsAppService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;
  private isInitialized = false;

  constructor() {
    this.fromNumber = TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox number
    this.initialize();
  }

  // Initialize Twilio client
  private initialize() {
    try {
      const accountSid = TWILIO_ACCOUNT_SID;
      const authToken = TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        console.log('⚠️ Twilio credentials not found. WhatsApp service will be disabled.');
        console.log(`Account SID: ${accountSid ? 'Set' : 'Not set'}`);
        console.log(`Auth Token: ${authToken ? 'Set' : 'Not set'}`);
        return;
      }

      this.client = twilio(accountSid, authToken);
      this.isInitialized = true;
      console.log('✅ Twilio WhatsApp service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Twilio WhatsApp service:', error);
    }
  }

  // Send task reminder via WhatsApp
  async sendTaskReminder(data: TaskReminderData): Promise<boolean> {
    if (!this.isInitialized || !this.client) {
      console.log('⚠️ WhatsApp service not initialized');
      return false;
    }

    try {
      const { task, user, daysUntilDue } = data;

      if (!user.phoneNumber) {
        console.log('⚠️ User has no phone number for WhatsApp');
        return false;
      }

      const urgencyEmoji = daysUntilDue === 0 ? '🚨' : daysUntilDue === 1 ? '⏰' : '📅';
      const timeText = daysUntilDue === 0 ? 'TODAY' : 
                      daysUntilDue === 1 ? 'TOMORROW' : 
                      `in ${daysUntilDue} days`;

      const message = `${urgencyEmoji} *Task Reminder*

📝 *Task:* ${task.title}
⏰ *Due:* ${timeText}
📊 *Priority:* ${task.label || 'Normal'}

${daysUntilDue === 0 ? 
  '🚨 This task is due today! Don\'t forget to complete it.' :
  `📌 This task is due ${timeText}. Plan accordingly!`
}

_Powered by TaskSync_ ✨`;

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `whatsapp:${user.phoneNumber}`
      });

      console.log(`✅ WhatsApp reminder sent to ${user.phoneNumber}:`, result.sid);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp reminder:', error);
      return false;
    }
  }

  // Send weekly report via WhatsApp
  async sendWeeklyReport(data: WeeklyReportData): Promise<boolean> {
    if (!this.isInitialized || !this.client) {
      console.log('⚠️ WhatsApp service not initialized');
      return false;
    }

    try {
      const { user, stats, period, insights } = data;

      if (!user.phoneNumber) {
        console.log('⚠️ User has no phone number for WhatsApp');
        return false;
      }

      const completionRate = stats.totalTasks > 0 ? 
        Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

      const performanceEmoji = completionRate >= 80 ? '🏆' : 
                              completionRate >= 60 ? '👍' : 
                              completionRate >= 40 ? '📈' : '💪';

      let message = `📊 *Weekly Report - Week ${period.weekNumber}*

${performanceEmoji} *Performance Summary:*
✅ Completed: ${stats.completedTasks}
📝 Total Tasks: ${stats.totalTasks}
📊 Completion Rate: ${completionRate}%
⏱️ Overdue: ${stats.overdueTasks}

🎯 *This Week's Highlights:*`;

      insights.slice(0, 3).forEach((insight, index) => {
        message += `\n${index + 1}. ${insight}`;
      });

      message += `\n\n${completionRate >= 80 ? 
        '🎉 Excellent work this week! Keep it up!' :
        completionRate >= 60 ? 
        '👏 Good progress! A few more tasks and you\'ll be on fire!' :
        '💪 Room for improvement. Focus on your priorities next week!'
      }

_Your weekly insights from TaskSync_ ✨`;

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `whatsapp:${user.phoneNumber}`
      });

      console.log(`✅ WhatsApp weekly report sent to ${user.phoneNumber}:`, result.sid);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp weekly report:', error);
      return false;
    }
  }

  // Send custom message
  async sendCustomMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isInitialized || !this.client) {
      console.log('⚠️ WhatsApp service not initialized');
      return false;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `whatsapp:${phoneNumber}`
      });

      console.log(`✅ WhatsApp message sent to ${phoneNumber}:`, result.sid);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      return false;
    }
  }

  // Send media message
  async sendMediaMessage(phoneNumber: string, message: string, mediaUrl: string): Promise<boolean> {
    if (!this.isInitialized || !this.client) {
      console.log('⚠️ WhatsApp service not initialized');
      return false;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        mediaUrl: [mediaUrl],
        from: this.fromNumber,
        to: `whatsapp:${phoneNumber}`
      });

      console.log(`✅ WhatsApp media message sent to ${phoneNumber}:`, result.sid);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp media message:', error);
      return false;
    }
  }

  // Check if WhatsApp service is available
  isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasCredentials: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN),
      fromNumber: this.fromNumber
    };
  }

  // Test connection
  async testConnection(testPhoneNumber: string): Promise<boolean> {
    if (!this.isInitialized || !this.client) {
      console.log('⚠️ WhatsApp service not initialized');
      return false;
    }

    try {
      const testMessage = `🧪 *TaskSync Test Message*

Hi! This is a test message from your TaskSync notification system.

✅ WhatsApp notifications are working correctly!

_If you received this message, your notification setup is complete._ 🎉`;

      const result = await this.client.messages.create({
        body: testMessage,
        from: this.fromNumber,
        to: `whatsapp:${testPhoneNumber}`
      });

      console.log(`✅ WhatsApp test message sent to ${testPhoneNumber}:`, result.sid);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp test message:', error);
      return false;
    }
  }
}

export default new WhatsAppService();
