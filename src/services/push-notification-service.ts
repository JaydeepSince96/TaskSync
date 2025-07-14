// src/services/push-notification-service.ts
import OneSignal from 'onesignal-node';

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

class PushNotificationService {
  private oneSignalClient: OneSignal.Client | null = null;
  private isInitialized = false;
  private appId: string;
  private apiKey: string;

  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID || '';
    this.apiKey = process.env.ONESIGNAL_API_KEY || '';
    this.initialize();
  }

  // Initialize OneSignal client
  private initialize() {
    try {
      if (!this.appId || !this.apiKey) {
        console.log('⚠️ OneSignal credentials not found. Push notifications will be disabled.');
        return;
      }

      this.oneSignalClient = new OneSignal.Client(this.appId, this.apiKey);
      this.isInitialized = true;
      console.log('✅ Push notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize push notification service:', error);
    }
  }

  // Send task reminder push notification
  async sendTaskReminder(data: TaskReminderData, userDeviceTokens: string[] = []): Promise<boolean> {
    if (!this.isInitialized || !this.oneSignalClient) {
      console.log('⚠️ Push notification service not initialized');
      return false;
    }

    try {
      const { task, user, daysUntilDue } = data;

      const timeText = daysUntilDue === 0 ? 'today' : 
                      daysUntilDue === 1 ? 'tomorrow' : 
                      `in ${daysUntilDue} days`;

      const urgencyLevel = daysUntilDue === 0 ? 'urgent' : daysUntilDue === 1 ? 'important' : 'normal';
      
      // Create notification content
      const notification = {
        contents: {
          en: `📋 "${task.title}" is due ${timeText}. Don't let it slip away!`
        },
        headings: {
          en: daysUntilDue === 0 ? '🚨 Task Due Today!' : 
              daysUntilDue === 1 ? '⏰ Task Due Tomorrow' : 
              '🔔 Task Reminder'
        },
        data: {
          type: 'task_reminder',
          taskId: task._id,
          urgency: urgencyLevel,
          daysUntilDue: daysUntilDue
        },
        // Add action buttons
        buttons: [
          {
            id: 'mark_complete',
            text: '✅ Mark Complete',
            icon: 'ic_menu_check'
          },
          {
            id: 'view_task',
            text: '👁️ View Task',
            icon: 'ic_menu_view'
          }
        ],
        // Set priority based on urgency
        priority: urgencyLevel === 'urgent' ? 10 : urgencyLevel === 'important' ? 7 : 5,
        // Custom sound and icon
        android_sound: urgencyLevel === 'urgent' ? 'urgent_notification' : 'default',
        ios_sound: urgencyLevel === 'urgent' ? 'urgent_notification.wav' : 'default',
        large_icon: 'ic_task_notification',
        small_icon: 'ic_stat_notification',
        // Badge count
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        // Include user filter or specific device tokens
        ...(userDeviceTokens.length > 0 
          ? { include_player_ids: userDeviceTokens }
          : { 
              filters: [
                { field: 'tag', key: 'userId', relation: '=', value: user._id.toString() }
              ]
            }
        )
      };

      const response = await this.oneSignalClient.createNotification(notification);
      console.log(`✅ Task reminder push notification sent to user ${user.email}`, response);
      return true;
    } catch (error) {
      console.error('❌ Error sending task reminder push notification:', error);
      return false;
    }
  }

  // Send weekly report push notification
  async sendWeeklyReport(data: WeeklyReportData, userDeviceTokens: string[] = []): Promise<boolean> {
    if (!this.isInitialized || !this.oneSignalClient) {
      console.log('⚠️ Push notification service not initialized');
      return false;
    }

    try {
      const { user, stats, period } = data;
      
      const completionRate = stats.totalTasks > 0 ? 
        Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

      const notification = {
        contents: {
          en: `📊 Week ${period.weekNumber}: ${completionRate}% completion rate. ${stats.completedTasks}/${stats.totalTasks} tasks completed!`
        },
        headings: {
          en: '📈 Your Weekly Report is Ready!'
        },
        data: {
          type: 'weekly_report',
          weekNumber: period.weekNumber,
          completionRate: completionRate,
          stats: stats
        },
        buttons: [
          {
            id: 'view_report',
            text: '📊 View Report',
            icon: 'ic_menu_report'
          },
          {
            id: 'plan_week',
            text: '📅 Plan Next Week',
            icon: 'ic_menu_calendar'
          }
        ],
        large_icon: 'ic_report_notification',
        small_icon: 'ic_stat_notification',
        priority: 5,
        // Include user filter or specific device tokens
        ...(userDeviceTokens.length > 0 
          ? { include_player_ids: userDeviceTokens }
          : { 
              filters: [
                { field: 'tag', key: 'userId', relation: '=', value: user._id.toString() }
              ]
            }
        )
      };

      const response = await this.oneSignalClient.createNotification(notification);
      console.log(`✅ Weekly report push notification sent to user ${user.email}`, response);
      return true;
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
    userDeviceTokens: string[] = []
  ): Promise<boolean> {
    if (!this.isInitialized || !this.oneSignalClient) {
      console.log('⚠️ Push notification service not initialized');
      return false;
    }

    try {
      const notification = {
        contents: { en: message },
        headings: { en: title },
        data: {
          type: 'custom',
          ...data
        },
        large_icon: 'ic_notification',
        small_icon: 'ic_stat_notification',
        priority: 5,
        // Include user filter or specific device tokens
        ...(userDeviceTokens.length > 0 
          ? { include_player_ids: userDeviceTokens }
          : { 
              filters: [
                { field: 'tag', key: 'userId', relation: '=', value: userId }
              ]
            }
        )
      };

      const response = await this.oneSignalClient.createNotification(notification);
      console.log(`✅ Custom push notification sent to user ${userId}`, response);
      return true;
    } catch (error) {
      console.error('❌ Error sending custom push notification:', error);
      return false;
    }
  }

  // Send broadcast notification to all users
  async sendBroadcastNotification(title: string, message: string, data: any = {}): Promise<boolean> {
    if (!this.isInitialized || !this.oneSignalClient) {
      console.log('⚠️ Push notification service not initialized');
      return false;
    }

    try {
      const notification = {
        contents: { en: message },
        headings: { en: title },
        data: {
          type: 'broadcast',
          ...data
        },
        included_segments: ['All'],
        large_icon: 'ic_broadcast_notification',
        small_icon: 'ic_stat_notification',
        priority: 7
      };

      const response = await this.oneSignalClient.createNotification(notification);
      console.log('✅ Broadcast push notification sent to all users', response);
      return true;
    } catch (error) {
      console.error('❌ Error sending broadcast push notification:', error);
      return false;
    }
  }

  // Register device for push notifications
  async registerDevice(userId: string, deviceToken: string, deviceType: 'ios' | 'android'): Promise<boolean> {
    if (!this.isInitialized || !this.oneSignalClient) {
      console.log('⚠️ Push notification service not initialized');
      return false;
    }

    try {
      const device = {
        device_type: deviceType === 'ios' ? 0 : 1,
        identifier: deviceToken,
        tags: {
          userId: userId
        }
      };

      const response = await this.oneSignalClient.addDevice(device);
      console.log(`✅ Device registered for user ${userId}:`, response);
      return true;
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return false;
    }
  }

  // Test push notification service
  async sendTestNotification(userDeviceTokens: string[]): Promise<boolean> {
    if (!this.isInitialized || !this.oneSignalClient) {
      console.log('⚠️ Push notification service not initialized');
      return false;
    }

    try {
      const notification = {
        contents: {
          en: '🧪 This is a test notification from your TaskSync app. If you see this, push notifications are working!'
        },
        headings: {
          en: '✅ Push Notification Test'
        },
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        },
        include_player_ids: userDeviceTokens,
        large_icon: 'ic_test_notification',
        small_icon: 'ic_stat_notification',
        priority: 5
      };

      const response = await this.oneSignalClient.createNotification(notification);
      console.log('✅ Test push notification sent:', response);
      return true;
    } catch (error) {
      console.error('❌ Error sending test push notification:', error);
      return false;
    }
  }

  // Check if push notification service is available
  isAvailable(): boolean {
    return this.isInitialized && this.oneSignalClient !== null;
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasCredentials: !!(this.appId && this.apiKey),
      appId: this.appId ? '***' + this.appId.slice(-4) : 'Not set',
      provider: 'OneSignal'
    };
  }

  // Get notification statistics from OneSignal
  async getNotificationStats(notificationId: string) {
    if (!this.isInitialized || !this.oneSignalClient) {
      return null;
    }

    try {
      const stats = await this.oneSignalClient.viewNotification(notificationId);
      return stats;
    } catch (error) {
      console.error('❌ Error getting notification stats:', error);
      return null;
    }
  }
}

export default new PushNotificationService();
