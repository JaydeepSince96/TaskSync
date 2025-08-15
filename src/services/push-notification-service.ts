// src/services/push-notification-service.ts
import admin from 'firebase-admin';
import path from 'path';
import type { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';

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

export class PushNotificationService {
  private isInitialized = false;
  constructor() {
    try {
      if (!admin.apps.length) {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'firebase-service-account.json');
        
        // Check if the service account file exists before trying to initialize
        if (require('fs').existsSync(serviceAccountPath)) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
          });
          this.isInitialized = true;
          console.log('✅ FCM push notification service initialized successfully');
        } else {
          console.log('⚠️ Firebase service account file not found. Push notifications will be disabled.');
          this.isInitialized = false;
        }
      } else {
        this.isInitialized = true;
        console.log('✅ FCM push notification service already initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize FCM push notification service:', error);
      this.isInitialized = false;
    }
  }

  // Send task reminder push notification
  async sendTaskReminder(data: TaskReminderData, deviceTokens: string[] = []): Promise<boolean> {
    if (!this.isInitialized || deviceTokens.length === 0) {
      console.log('⚠️ FCM push notification service not initialized or no device tokens');
      return false;
    }
    try {
      const { task, daysUntilDue } = data;
      const timeText = daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`;
      const message: MulticastMessage = {
        notification: {
          title: daysUntilDue === 0 ? '🚨 Task Due Today!' : daysUntilDue === 1 ? '⏰ Task Due Tomorrow' : '🔔 Task Reminder',
          body: `📋 "${task.title}" is due ${timeText}. Don't let it slip away!`,
        },
        data: {
          type: 'task_reminder',
          taskId: task._id.toString(),
          daysUntilDue: daysUntilDue.toString(),
        },
        tokens: deviceTokens,
      };
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`✅ Task reminder push notification sent`, response);
      return response.successCount > 0;
    } catch (error) {
      console.error('❌ Error sending task reminder push notification:', error);
      return false;
    }
  }

  // Send weekly report push notification
  async sendWeeklyReport(data: WeeklyReportData, deviceTokens: string[] = []): Promise<boolean> {
    if (!this.isInitialized || deviceTokens.length === 0) {
      console.log('⚠️ FCM push notification service not initialized or no device tokens');
      return false;
    }
    try {
      const { stats, period } = data;
      const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
      const message: MulticastMessage = {
        notification: {
          title: '📈 Your Weekly Report is Ready!',
          body: `📊 Week ${period.weekNumber}: ${completionRate}% completion rate. ${stats.completedTasks}/${stats.totalTasks} tasks completed!`,
        },
        data: {
          type: 'weekly_report',
          weekNumber: period.weekNumber.toString(),
          completionRate: completionRate.toString(),
        },
        tokens: deviceTokens,
      };
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`✅ Weekly report push notification sent`, response);
      return response.successCount > 0;
    } catch (error) {
      console.error('❌ Error sending weekly report push notification:', error);
      return false;
    }
  }

  // Send custom push notification
  async sendCustomNotification(
    userId: string,
    title: string,
    message: string,
    data: any = {},
    deviceTokens: string[] = []
  ): Promise<boolean> {
    if (!this.isInitialized || deviceTokens.length === 0) {
      console.log('⚠️ FCM push notification service not initialized or no device tokens');
      return false;
    }
    try {
      const msg: MulticastMessage = {
        notification: {
          title,
          body: message,
        },
        data: {
          type: 'custom',
          userId,
          ...data,
        },
        tokens: deviceTokens,
      };
      const response = await admin.messaging().sendEachForMulticast(msg);
      console.log(`✅ Custom push notification sent to user ${userId}`, response);
      return response.successCount > 0;
    } catch (error) {
      console.error('❌ Error sending custom push notification:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      provider: 'FCM',
    };
  }
}
