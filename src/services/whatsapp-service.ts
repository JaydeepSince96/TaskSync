// src/services/whatsapp-service.ts
import twilio from 'twilio';
import { IUser } from '../models/user-model';
import { ITask } from '../models/task-model';
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

interface TaskDeadlineData {
  task: ITask;
  user: IUser;
  isDeadline: boolean; // true if startDate === dueDate
}

interface DailyReminderData {
  user: IUser;
  tasks: ITask[];
  reminderTime: '10am' | '3pm' | '7pm';
}

export class WhatsAppService {
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

      console.log('🔧 Initializing WhatsApp service...');
      console.log('  - Account SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'Not set');
      console.log('  - Auth Token:', authToken ? `${authToken.substring(0, 10)}...` : 'Not set');
      console.log('  - From Number:', this.fromNumber);

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

  // Send task deadline notification (when startDate === dueDate)
  async sendTaskDeadlineNotification(data: TaskDeadlineData): Promise<boolean> {
    if (!this.isInitialized || !this.client) {
      console.log('⚠️ WhatsApp service not initialized');
      return false;
    }

    try {
      const { task, user, isDeadline } = data;

      if (!user.phoneNumber) {
        console.log('⚠️ User has no phone number for WhatsApp');
        return false;
      }

      const deadlineEmoji = isDeadline ? '🚨' : '📅';
      const deadlineText = isDeadline ? 'DEADLINE TODAY' : 'Task Due Today';

      const message = `${deadlineEmoji} *Task ${deadlineText}*

📝 *Task:* ${task.title}
📅 *Date:* ${new Date(task.dueDate).toLocaleDateString()}
⏰ *Time:* ${new Date(task.dueDate).toLocaleTimeString()}
📊 *Priority:* ${task.label || 'Normal'}
✅ *Status:* ${task.completed ? 'Completed' : 'Pending'}

${task.description ? `📄 *Description:* ${task.description}\n` : ''}

${isDeadline ? 
  '🚨 This task has the same start and due date. Complete it today!' :
  '📌 This task is due today. Make sure to complete it!'
}

_Powered by TaskSync_ ✨`;

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `whatsapp:${user.phoneNumber}`
      });

      console.log(`✅ WhatsApp deadline notification sent to ${user.phoneNumber}:`, result.sid);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp deadline notification:', error);
      return false;
    }
  }

  // Send daily reminder at specific times (10am, 3pm, 7pm)
  async sendDailyReminder(data: DailyReminderData): Promise<boolean> {
    if (!this.isInitialized || !this.client) {
      console.log('⚠️ WhatsApp service not initialized');
      return false;
    }

    try {
      const { user, tasks, reminderTime } = data;

      if (!user.phoneNumber) {
        console.log('⚠️ User has no phone number for WhatsApp');
        return false;
      }

      const timeEmoji = reminderTime === '10am' ? '🌅' : reminderTime === '3pm' ? '☀️' : '🌆';
      const timeText = reminderTime === '10am' ? 'Morning' : reminderTime === '3pm' ? 'Afternoon' : 'Evening';

      // Filter tasks based on time
      const pendingTasks = tasks.filter(task => !task.completed);
      const completedTasks = tasks.filter(task => task.completed);

      let message = `${timeEmoji} *${timeText} Task Reminder*

👋 Hello ${user.name || user.email}!

📊 *Task Summary:*
✅ Completed: ${completedTasks.length}
⏳ Pending: ${pendingTasks.length}
📅 Total: ${tasks.length}

`;

      if (pendingTasks.length > 0) {
        message += `\n📋 *Pending Tasks:*\n`;
        pendingTasks.slice(0, 5).forEach((task, index) => {
          const dueDate = new Date(task.dueDate);
          const isOverdue = dueDate < new Date();
          const overdueEmoji = isOverdue ? '🚨' : '📅';
          const overdueText = isOverdue ? ' (OVERDUE)' : '';
          
          message += `${index + 1}. ${overdueEmoji} ${task.title}${overdueText}\n`;
          message += `   📅 Due: ${dueDate.toLocaleDateString()}\n`;
          message += `   📊 Priority: ${task.label || 'Normal'}\n\n`;
        });

        if (pendingTasks.length > 5) {
          message += `... and ${pendingTasks.length - 5} more tasks\n\n`;
        }
      }

      if (completedTasks.length > 0) {
        message += `✅ *Recently Completed:*\n`;
        completedTasks.slice(0, 3).forEach((task, index) => {
          message += `${index + 1}. ${task.title}\n`;
        });
        message += '\n';
      }

      message += `💡 *Tip:* Stay organized and tackle your tasks efficiently!\n\n`;
      message += `_Powered by TaskSync_ ✨`;

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `whatsapp:${user.phoneNumber}`
      });

      console.log(`✅ WhatsApp daily reminder (${reminderTime}) sent to ${user.phoneNumber}:`, result.sid);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp daily reminder:', error);
      return false;
    }
  }

  // Send task reminder via WhatsApp (existing method)
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

      const message = `📊 *Weekly Task Report*

👋 Hello ${user.name || user.email}!

📅 *Period:* Week ${period.weekNumber}
📈 *Stats:*
• ✅ Completed: ${stats.completedTasks}
• ⏳ Pending: ${stats.pendingTasks}
• 📊 Total: ${stats.totalTasks}
• 🎯 Completion Rate: ${stats.completionRate}%

💡 *Insights:*
${insights.map(insight => `• ${insight}`).join('\n')}

🚀 Keep up the great work!

_Powered by TaskSync_ ✨`;

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

  // Send custom message via WhatsApp
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

      console.log(`✅ Custom WhatsApp message sent to ${phoneNumber}:`, result.sid);
      return true;
    } catch (error) {
      console.error('❌ Error sending custom WhatsApp message:', error);
      return false;
    }
  }

  // Send media message via WhatsApp
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

      console.log(`✅ Media WhatsApp message sent to ${phoneNumber}:`, result.sid);
      return true;
    } catch (error) {
      console.error('❌ Error sending media WhatsApp message:', error);
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
      available: this.isAvailable(),
      initialized: this.isInitialized,
      fromNumber: this.fromNumber,
      hasCredentials: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)
    };
  }

  // WhatsApp test functionality removed - not needed for production
}
