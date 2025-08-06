// src/services/notification-scheduler.ts
import { WhatsAppService } from './whatsapp-service';
import { EmailService } from './email-service';
import { IUser } from '../models/user-model';
import { ITask } from '../models/task-model';
import Task from '../models/task-model';
import { User } from '../models/user-model';

interface NotificationSchedule {
  userId: string;
  taskId: string;
  type: 'deadline' | 'daily' | 'reminder';
  time?: '10am' | '3pm' | '7pm';
  scheduledFor: Date;
  sent: boolean;
}

export class NotificationScheduler {
  private whatsappService: WhatsAppService;
  private emailService: EmailService;
  private schedules: Map<string, NodeJS.Timeout> = new Map();
  private sentNotifications: Map<string, Set<string>> = new Map(); // Track sent notifications by date and taskId

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.emailService = new EmailService();
    this.initializeScheduler();
  }

  // Initialize the notification scheduler
  private initializeScheduler() {
    console.log('🕐 Initializing notification scheduler...');
    
    // Schedule daily reminders at 10am, 3pm, and 7pm
    this.scheduleDailyReminders();
    
    // Check for deadline notifications every hour
    this.scheduleDeadlineCheck();
    
    console.log('✅ Notification scheduler initialized');
  }

  // Schedule daily reminders at specific times
  private scheduleDailyReminders() {
    const reminderTimes = [
      { time: '10am', hour: 10, minute: 0 },
      { time: '3pm', hour: 15, minute: 0 },
      { time: '7pm', hour: 19, minute: 0 }
    ];

    reminderTimes.forEach(({ time, hour, minute }) => {
      this.scheduleDailyReminder(time as '10am' | '3pm' | '7pm', hour, minute);
    });
  }

  // Schedule a daily reminder at specific time
  private scheduleDailyReminder(time: '10am' | '3pm' | '7pm', hour: number, minute: number) {
    const scheduleReminder = () => {
      this.sendDailyRemindersToAllUsers(time);
    };

    // Calculate next occurrence
    const now = new Date();
    const nextReminder = new Date();
    nextReminder.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const delay = nextReminder.getTime() - now.getTime();
    
    // Schedule the reminder
    const timeout = setTimeout(() => {
      scheduleReminder();
      // Schedule next day's reminder
      this.scheduleDailyReminder(time, hour, minute);
    }, delay);

    this.schedules.set(`daily-${time}`, timeout);
    
    console.log(`📅 Scheduled daily reminder for ${time} at ${nextReminder.toLocaleString()}`);
  }

  // Send daily reminders to all users
  private async sendDailyRemindersToAllUsers(time: '10am' | '3pm' | '7pm') {
    try {
      console.log(`📱 Sending daily reminders (${time}) to all users...`);

      const users = await User.find({ phoneNumber: { $exists: true, $ne: '' } });
      console.log(`🔍 Found ${users.length} users with phone numbers`);
      
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      
      for (const user of users) {
        try {
          console.log(`📱 Processing user: ${user.email} (${user.phoneNumber})`);
          
          // Check if daily reminder already sent today for this user
          const userId = (user._id as any).toString();
          if (this.hasNotificationBeenSent('daily-reminder', userId, `daily-${time}`)) {
            console.log(`⏭️ Daily reminder (${time}) already sent today to ${user.email}`);
            skippedCount++;
            continue;
          }
          
          // Get user's tasks
          const tasks = await Task.find({
            $or: [
              { userId: user._id },
              { assignedTo: user._id }
            ]
          }).sort({ dueDate: 1 });

          console.log(`📋 User ${user.email} has ${tasks.length} tasks (${tasks.filter(t => !t.completed).length} pending, ${tasks.filter(t => t.completed).length} completed)`);

          if (tasks.length > 0) {
            const result = await this.whatsappService.sendDailyReminder({
              user,
              tasks,
              reminderTime: time
            });
            
            if (result) {
              this.markNotificationAsSent('daily-reminder', userId, `daily-${time}`);
              successCount++;
              console.log(`✅ Daily reminder (${time}) sent successfully to ${user.email}`);
            } else {
              errorCount++;
              console.log(`❌ Failed to send daily reminder (${time}) to ${user.email}`);
            }
          } else {
            console.log(`⚠️ User ${user.email} has no tasks, skipping daily reminder`);
            skippedCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error sending daily reminder to user ${user._id} (${user.email}):`, error);
        }
      }

      console.log(`✅ Daily reminders (${time}) completed: ${successCount} successful, ${errorCount} failed, ${skippedCount} skipped`);
    } catch (error) {
      console.error('❌ Error in sendDailyRemindersToAllUsers:', error);
    }
  }

  // Schedule deadline check every hour
  private scheduleDeadlineCheck() {
    const checkDeadlines = async () => {
      await this.checkAndSendDeadlineNotifications();
    };

    // Check every hour
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000);
    
    // Also check immediately
    checkDeadlines();
    
    this.schedules.set('deadline-check', interval);
    console.log('⏰ Scheduled deadline check every hour');
  }

  // Check and send deadline notifications
  public async checkAndSendDeadlineNotifications() {
    try {
      console.log('🔍 Checking for deadline notifications...');

      // Clean up old notification records
      this.cleanupOldNotificationRecords();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find tasks due today
      const tasksDueToday = await Task.find({
        dueDate: {
          $gte: today,
          $lt: tomorrow
        },
        completed: false
      }).populate('userId assignedTo');

      let notificationsSent = 0;
      let notificationsSkipped = 0;

      for (const task of tasksDueToday) {
        try {
          const isDeadline = this.isSameDay(task.startDate, task.dueDate);
          
          // Only send notifications for deadline tasks (same start and due date)
          if (isDeadline) {
            // Send to task creator
            if (task.userId && typeof task.userId === 'object' && 'phoneNumber' in task.userId) {
              const userId = (task.userId as any)._id.toString();
              const taskId = (task._id as any).toString();
              
              if (!this.hasNotificationBeenSent(taskId, userId, 'deadline')) {
                await this.whatsappService.sendTaskDeadlineNotification({
                  task,
                  user: task.userId as unknown as IUser,
                  isDeadline
                });
                this.markNotificationAsSent(taskId, userId, 'deadline');
                notificationsSent++;
                console.log(`✅ Deadline notification sent to task creator for task ${taskId}`);
              } else {
                console.log(`⏭️ Deadline notification already sent today to task creator for task ${taskId}`);
                notificationsSkipped++;
              }
            }

            // Send to assigned users
            if (task.assignedTo && Array.isArray(task.assignedTo)) {
              for (const assignedUser of task.assignedTo) {
                if (assignedUser && typeof assignedUser === 'object' && 'phoneNumber' in assignedUser) {
                  const userId = (assignedUser as any)._id.toString();
                  const taskId = (task._id as any).toString();
                  
                  if (!this.hasNotificationBeenSent(taskId, userId, 'deadline')) {
                    await this.whatsappService.sendTaskDeadlineNotification({
                      task,
                      user: assignedUser as unknown as IUser,
                      isDeadline
                    });
                    this.markNotificationAsSent(taskId, userId, 'deadline');
                    notificationsSent++;
                    console.log(`✅ Deadline notification sent to assigned user for task ${taskId}`);
                  } else {
                    console.log(`⏭️ Deadline notification already sent today to assigned user for task ${taskId}`);
                    notificationsSkipped++;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error sending deadline notification for task ${task._id}:`, error);
        }
      }

      console.log(`✅ Deadline notifications completed: ${notificationsSent} sent, ${notificationsSkipped} skipped`);
    } catch (error) {
      console.error('❌ Error in checkAndSendDeadlineNotifications:', error);
    }
  }

  // Check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // Schedule a one-time notification
  public scheduleNotification(schedule: NotificationSchedule) {
    const delay = schedule.scheduledFor.getTime() - Date.now();
    
    if (delay <= 0) {
      console.log('⚠️ Notification time has already passed');
      return;
    }

    const timeout = setTimeout(async () => {
      await this.sendScheduledNotification(schedule);
    }, delay);

    this.schedules.set(schedule.taskId, timeout);
    console.log(`📅 Scheduled notification for task ${schedule.taskId} at ${schedule.scheduledFor.toLocaleString()}`);
  }

  // Send a scheduled notification
  private async sendScheduledNotification(schedule: NotificationSchedule) {
    try {
      const task = await Task.findById(schedule.taskId).populate('userId assignedTo');
      const user = await User.findById(schedule.userId);

      if (!task || !user) {
        console.log('❌ Task or user not found for scheduled notification');
        return;
      }

      switch (schedule.type) {
        case 'deadline':
          const isDeadline = this.isSameDay(task.startDate, task.dueDate);
          await this.whatsappService.sendTaskDeadlineNotification({
            task,
            user,
            isDeadline
          });
          break;

        case 'daily':
          const userTasks = await Task.find({
            $or: [
              { userId: user._id },
              { assignedTo: user._id }
            ]
          }).sort({ dueDate: 1 });

          await this.whatsappService.sendDailyReminder({
            user,
            tasks: userTasks,
            reminderTime: schedule.time || '10am'
          });
          break;

        case 'reminder':
          // Calculate days until due
          const daysUntilDue = Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          await this.whatsappService.sendTaskReminder({
            task,
            user,
            daysUntilDue
          });
          break;
      }

      console.log(`✅ Scheduled notification sent for task ${schedule.taskId}`);
    } catch (error) {
      console.error('❌ Error sending scheduled notification:', error);
    }
  }

  // Cancel a scheduled notification
  public cancelNotification(taskId: string) {
    const timeout = this.schedules.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.schedules.delete(taskId);
      console.log(`❌ Cancelled notification for task ${taskId}`);
    }
  }

  // Get next reminder times for debugging
  private getNextReminderTimes() {
    const now = new Date();
    const reminderTimes = [
      { time: '10am', hour: 10, minute: 0 },
      { time: '3pm', hour: 15, minute: 0 },
      { time: '7pm', hour: 19, minute: 0 }
    ];

    return reminderTimes.map(({ time, hour, minute }) => {
      const nextReminder = new Date();
      nextReminder.setHours(hour, minute, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (nextReminder <= now) {
        nextReminder.setDate(nextReminder.getDate() + 1);
      }

      return {
        time,
        nextOccurrence: nextReminder.toISOString(),
        timeUntilNext: nextReminder.getTime() - now.getTime()
      };
    });
  }

  // Manually clear notification records for testing
  public clearNotificationRecords(): void {
    this.sentNotifications.clear();
    console.log('🧹 All notification records cleared for testing');
  }

  // Get notification tracking status
  public getNotificationTrackingStatus(): any {
    const status: any = {};
    for (const [dateKey, notifications] of this.sentNotifications) {
      status[dateKey] = Array.from(notifications);
    }
    return status;
  }

  // Manually trigger daily reminders for testing
  public async triggerDailyReminders(time: '10am' | '3pm' | '7pm') {
    console.log(`🔧 Manually triggering daily reminders for ${time}...`);
    await this.sendDailyRemindersToAllUsers(time);
  }

  // Get scheduler status
  public getStatus() {
    return {
      activeSchedules: this.schedules.size,
      whatsappAvailable: this.whatsappService.isAvailable(),
      emailAvailable: this.emailService.isAvailable()
    };
  }

  // Clean up scheduler
  public cleanup() {
    this.schedules.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.schedules.clear();
    console.log('🧹 Notification scheduler cleaned up');
  }

  // Check if a notification has already been sent today
  private hasNotificationBeenSent(taskId: string, userId: string, type: string): boolean {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const key = `${today}-${type}`;
    const notificationKey = `${taskId}-${userId}`;
    
    if (!this.sentNotifications.has(key)) {
      this.sentNotifications.set(key, new Set());
      return false;
    }
    
    return this.sentNotifications.get(key)!.has(notificationKey);
  }

  // Mark a notification as sent
  private markNotificationAsSent(taskId: string, userId: string, type: string): void {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const key = `${today}-${type}`;
    const notificationKey = `${taskId}-${userId}`;
    
    if (!this.sentNotifications.has(key)) {
      this.sentNotifications.set(key, new Set());
    }
    
    this.sentNotifications.get(key)!.add(notificationKey);
    console.log(`📝 Marked ${type} notification as sent for task ${taskId}, user ${userId}`);
  }

  // Clear old notification records (older than 7 days)
  private cleanupOldNotificationRecords(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    for (const [dateKey] of this.sentNotifications) {
      const date = new Date(dateKey);
      if (date < sevenDaysAgo) {
        this.sentNotifications.delete(dateKey);
        console.log(`🧹 Cleaned up old notification records for ${dateKey}`);
      }
    }
  }
} 

// Global instance for use across the application
export let globalNotificationScheduler: NotificationScheduler | null = null;

export const initializeGlobalNotificationScheduler = () => {
  if (!globalNotificationScheduler) {
    globalNotificationScheduler = new NotificationScheduler();
  }
  return globalNotificationScheduler;
};

export const getGlobalNotificationScheduler = () => {
  return globalNotificationScheduler;
}; 