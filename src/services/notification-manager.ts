// src/services/notification-manager.ts
import whatsappService from './whatsapp-service';
import emailService from './email-service';
import pushNotificationService from './push-notification-service';
import TaskModel from '../models/task-model';
import { User } from '../models/user-model';

interface NotificationPreferences {
  whatsapp: boolean;
  email: boolean;
  push: boolean;
  taskReminders: boolean;
  weeklyReports: boolean;
  customMessages: boolean;
}

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

interface NotificationResult {
  success: boolean;
  sentVia: string[];
  errors: string[];
}

class NotificationManager {
  constructor() {
    console.log('🔔 Notification Manager initialized');
  }

  // Send task reminder via all enabled channels
  async sendTaskReminder(data: TaskReminderData, preferences?: NotificationPreferences): Promise<NotificationResult> {
    const { user } = data;
    const result: NotificationResult = {
      success: false,
      sentVia: [],
      errors: []
    };

    // Get user preferences if not provided
    if (!preferences) {
      preferences = await this.getUserNotificationPreferences(user._id);
    }

    console.log(`📨 Sending task reminder for "${data.task.title}" to ${user.email}`);

    // Send WhatsApp notification
    if (preferences.whatsapp && preferences.taskReminders && whatsappService.isAvailable()) {
      try {
        const sent = await whatsappService.sendTaskReminder(data);
        if (sent) {
          result.sentVia.push('WhatsApp');
        } else {
          result.errors.push('WhatsApp notification failed');
        }
      } catch (error) {
        result.errors.push(`WhatsApp error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Send Email notification
    if (preferences.email && preferences.taskReminders && emailService.isAvailable()) {
      try {
        const sent = await emailService.sendTaskReminder(data);
        if (sent) {
          result.sentVia.push('Email');
        } else {
          result.errors.push('Email notification failed');
        }
      } catch (error) {
        result.errors.push(`Email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Send Push notification
    if (preferences.push && preferences.taskReminders && pushNotificationService.isAvailable()) {
      try {
        const sent = await pushNotificationService.sendTaskReminder(data);
        if (sent) {
          result.sentVia.push('Push');
        } else {
          result.errors.push('Push notification failed');
        }
      } catch (error) {
        result.errors.push(`Push notification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.sentVia.length > 0;
    
    console.log(`✅ Task reminder sent via: ${result.sentVia.join(', ')} | Errors: ${result.errors.length}`);
    return result;
  }

  // Send weekly report via all enabled channels
  async sendWeeklyReport(data: WeeklyReportData, preferences?: NotificationPreferences): Promise<NotificationResult> {
    const { user } = data;
    const result: NotificationResult = {
      success: false,
      sentVia: [],
      errors: []
    };

    // Get user preferences if not provided
    if (!preferences) {
      preferences = await this.getUserNotificationPreferences(user._id);
    }

    console.log(`📊 Sending weekly report for week ${data.period.weekNumber} to ${user.email}`);

    // Send WhatsApp notification
    if (preferences.whatsapp && preferences.weeklyReports && whatsappService.isAvailable()) {
      try {
        const sent = await whatsappService.sendWeeklyReport(data);
        if (sent) {
          result.sentVia.push('WhatsApp');
        } else {
          result.errors.push('WhatsApp weekly report failed');
        }
      } catch (error) {
        result.errors.push(`WhatsApp error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Send Email notification
    if (preferences.email && preferences.weeklyReports && emailService.isAvailable()) {
      try {
        const sent = await emailService.sendWeeklyReport(data);
        if (sent) {
          result.sentVia.push('Email');
        } else {
          result.errors.push('Email weekly report failed');
        }
      } catch (error) {
        result.errors.push(`Email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Send Push notification
    if (preferences.push && preferences.weeklyReports && pushNotificationService.isAvailable()) {
      try {
        const sent = await pushNotificationService.sendWeeklyReport(data);
        if (sent) {
          result.sentVia.push('Push');
        } else {
          result.errors.push('Push weekly report failed');
        }
      } catch (error) {
        result.errors.push(`Push notification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.sentVia.length > 0;
    
    console.log(`✅ Weekly report sent via: ${result.sentVia.join(', ')} | Errors: ${result.errors.length}`);
    return result;
  }

  // Send custom message via all enabled channels
  async sendCustomMessage(
    userId: string, 
    title: string, 
    message: string, 
    channels: ('whatsapp' | 'email' | 'push')[] = ['whatsapp', 'email', 'push']
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      sentVia: [],
      errors: []
    };

    try {
      const user = await User.findById(userId);
      if (!user) {
        result.errors.push('User not found');
        return result;
      }

      const preferences = await this.getUserNotificationPreferences(userId);

      console.log(`📝 Sending custom message "${title}" to ${user.email}`);

      // Send WhatsApp notification
      if (channels.includes('whatsapp') && preferences.whatsapp && preferences.customMessages && whatsappService.isAvailable() && user.phoneNumber) {
        try {
          const sent = await whatsappService.sendCustomMessage(user.phoneNumber, `${title}\n\n${message}`);
          if (sent) {
            result.sentVia.push('WhatsApp');
          } else {
            result.errors.push('WhatsApp custom message failed');
          }
        } catch (error) {
          result.errors.push(`WhatsApp error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Send Email notification (custom email implementation would be needed)
      if (channels.includes('email') && preferences.email && preferences.customMessages && emailService.isAvailable()) {
        try {
          // For now, we'll use the test email method
          const sent = await emailService.sendTestEmail(user.email);
          if (sent) {
            result.sentVia.push('Email');
          } else {
            result.errors.push('Email custom message failed');
          }
        } catch (error) {
          result.errors.push(`Email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Send Push notification
      if (channels.includes('push') && preferences.push && preferences.customMessages && pushNotificationService.isAvailable()) {
        try {
          const sent = await pushNotificationService.sendCustomNotification(userId, title, message);
          if (sent) {
            result.sentVia.push('Push');
          } else {
            result.errors.push('Push custom message failed');
          }
        } catch (error) {
          result.errors.push(`Push notification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.sentVia.length > 0;
      
    } catch (error) {
      result.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log(`✅ Custom message sent via: ${result.sentVia.join(', ')} | Errors: ${result.errors.length}`);
    return result;
  }

  // Check for tasks due soon and send reminders
  async checkAndSendTaskReminders(): Promise<void> {
    try {
      console.log('🔍 Checking for tasks due soon...');
      
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Find tasks due within the next 3 days
      const tasksDueSoon = await TaskModel.find({
        dueDate: {
          $gte: now,
          $lte: threeDaysFromNow
        },
        isCompleted: false
      }).populate('userId');

      console.log(`📋 Found ${tasksDueSoon.length} tasks due soon`);

      for (const task of tasksDueSoon) {
        const user = task.userId;
        if (!user) continue;

        const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        // Only send reminders for tasks due today, tomorrow, or in 3 days
        if (daysUntilDue === 0 || daysUntilDue === 1 || daysUntilDue === 3) {
          await this.sendTaskReminder({
            task,
            user,
            daysUntilDue
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking task reminders:', error);
    }
  }

  // Generate and send weekly reports
  async generateAndSendWeeklyReports(): Promise<void> {
    try {
      console.log('📊 Generating weekly reports...');
      
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekNumber = Math.ceil(now.getDate() / 7);

      // Get all users who want weekly reports
      const users = await User.find({
        'notificationPreferences.weeklyReports': true
      });

      console.log(`👥 Generating reports for ${users.length} users`);

      for (const user of users) {
        try {
          // Get user's tasks for the week
          const weekTasks = await TaskModel.find({
            userId: user._id,
            createdAt: { $gte: weekStart, $lte: now }
          });

          const completedTasks = weekTasks.filter((task: any) => task.isCompleted).length;
          const overdueTasks = weekTasks.filter((task: any) => 
            !task.isCompleted && new Date(task.dueDate) < now
          ).length;

          const stats = {
            totalTasks: weekTasks.length,
            completedTasks,
            overdueTasks,
            pendingTasks: weekTasks.length - completedTasks - overdueTasks
          };

          // Generate insights
          const insights = this.generateWeeklyInsights(stats, weekTasks);

          await this.sendWeeklyReport({
            user,
            stats,
            period: {
              startDate: weekStart,
              endDate: now,
              weekNumber
            },
            insights
          });
        } catch (error) {
          console.error(`❌ Error generating report for user ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error generating weekly reports:', error);
    }
  }

  // Generate insights for weekly report
  private generateWeeklyInsights(stats: any, tasks: any[]): string[] {
    const insights: string[] = [];
    
    const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

    if (completionRate >= 80) {
      insights.push('🎉 Excellent completion rate! You\'re crushing your goals!');
    } else if (completionRate >= 60) {
      insights.push('👏 Good progress this week! Keep up the momentum!');
    } else if (completionRate >= 40) {
      insights.push('📈 Room for improvement. Consider breaking down large tasks.');
    } else {
      insights.push('💪 Focus on priorities. Start with small, achievable tasks.');
    }

    if (stats.overdueTasks > 0) {
      insights.push(`⚠️ ${stats.overdueTasks} overdue task(s). Consider rescheduling or breaking them down.`);
    }

    if (stats.totalTasks === 0) {
      insights.push('📝 No tasks created this week. Consider setting some goals for next week!');
    }

    // Analyze task patterns
    const highPriorityTasks = tasks.filter(task => task.label === 'high').length;
    if (highPriorityTasks > stats.totalTasks * 0.7) {
      insights.push('🔥 Many high-priority tasks. Consider if all are truly urgent.');
    }

    return insights;
  }

  // Get user notification preferences
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const user = await User.findById(userId);
      
      // Default preferences if user doesn't have any set
      const defaultPreferences: NotificationPreferences = {
        whatsapp: true,
        email: true,
        push: true,
        taskReminders: true,
        weeklyReports: true,
        customMessages: true
      };

      return user?.notificationPreferences || defaultPreferences;
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
      // Return default preferences on error
      return {
        whatsapp: true,
        email: true,
        push: true,
        taskReminders: true,
        weeklyReports: true,
        customMessages: true
      };
    }
  }

  // Test all notification services
  async testAllServices(testData: { email: string; phoneNumber?: string; deviceTokens?: string[] }): Promise<any> {
    const results = {
      whatsapp: { available: false, testSent: false, error: null as string | null },
      email: { available: false, testSent: false, error: null as string | null },
      push: { available: false, testSent: false, error: null as string | null }
    };

    // Test WhatsApp
    results.whatsapp.available = whatsappService.isAvailable();
    if (results.whatsapp.available && testData.phoneNumber) {
      try {
        results.whatsapp.testSent = await whatsappService.testConnection(testData.phoneNumber);
      } catch (error) {
        results.whatsapp.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Test Email
    results.email.available = emailService.isAvailable();
    if (results.email.available) {
      try {
        results.email.testSent = await emailService.sendTestEmail(testData.email);
      } catch (error) {
        results.email.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Test Push Notifications
    results.push.available = pushNotificationService.isAvailable();
    if (results.push.available && testData.deviceTokens && testData.deviceTokens.length > 0) {
      try {
        results.push.testSent = await pushNotificationService.sendTestNotification(testData.deviceTokens);
      } catch (error) {
        results.push.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return results;
  }

  // Get status of all notification services
  getServicesStatus() {
    return {
      whatsapp: whatsappService.getStatus(),
      email: emailService.getStatus(),
      push: pushNotificationService.getStatus()
    };
  }
}

export default new NotificationManager();
