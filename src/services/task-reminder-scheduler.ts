// src/services/task-reminder-scheduler.ts
import { PushNotificationService } from './push-notification-service';
import { WhatsAppService } from './whatsapp-service';
import { EmailService } from './email-service';
import { IUser } from '../models/user-model';
import { ITask } from '../models/task-model';
import Task from '../models/task-model';
import { User } from '../models/user-model';

interface TaskReminderData {
  task: ITask;
  user: IUser;
  reminderType: 'morning' | 'evening' | 'overdue';
  daysUntilDue?: number;
}

interface NotificationRecord {
  userId: string;
  taskId: string;
  type: 'morning' | 'evening' | 'overdue';
  date: string; // YYYY-MM-DD format
  sent: boolean;
  sentAt: Date;
}

export class TaskReminderScheduler {
  private pushNotificationService: PushNotificationService;
  private whatsappService: WhatsAppService;
  private emailService: EmailService;
  private notificationRecords: Map<string, NotificationRecord> = new Map();
  private morningReminderInterval?: NodeJS.Timeout;
  private eveningReminderInterval?: NodeJS.Timeout;
  private overdueCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.pushNotificationService = new PushNotificationService();
    this.whatsappService = new WhatsAppService();
    this.emailService = new EmailService();
    this.initializeScheduler();
  }

  // Initialize the scheduler
  private initializeScheduler() {
    console.log('🕐 Initializing Task Reminder Scheduler...');
    
    // Schedule morning reminders at 8 AM
    this.scheduleMorningReminders();
    
    // Schedule evening reminders at 5 PM
    this.scheduleEveningReminders();
    
    // Check for overdue tasks every hour
    this.scheduleOverdueCheck();
    
    console.log('✅ Task Reminder Scheduler initialized');
  }

  // Schedule morning reminders at 8 AM
  private scheduleMorningReminders() {
    const now = new Date();
    const morningTime = new Date(now);
    morningTime.setHours(8, 0, 0, 0);

    // If it's past 8 AM today, schedule for tomorrow
    if (now > morningTime) {
      morningTime.setDate(morningTime.getDate() + 1);
    }

    const delay = morningTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendMorningReminders();
      // Schedule next day's reminder
      this.scheduleMorningReminders();
    }, delay);

    console.log(`📅 Morning reminders scheduled for ${morningTime.toLocaleString()}`);
  }

  // Schedule evening reminders at 5 PM
  private scheduleEveningReminders() {
    const now = new Date();
    const eveningTime = new Date(now);
    eveningTime.setHours(17, 0, 0, 0); // 5 PM

    // If it's past 5 PM today, schedule for tomorrow
    if (now > eveningTime) {
      eveningTime.setDate(eveningTime.getDate() + 1);
    }

    const delay = eveningTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendEveningReminders();
      // Schedule next day's reminder
      this.scheduleEveningReminders();
    }, delay);

    console.log(`📅 Evening reminders scheduled for ${eveningTime.toLocaleString()}`);
  }

  // Schedule overdue task check every hour
  private scheduleOverdueCheck() {
    const checkOverdue = () => {
      this.checkAndSendOverdueNotifications();
      // Schedule next check in 1 hour
      setTimeout(checkOverdue, 60 * 60 * 1000);
    };

    // Start checking immediately
    checkOverdue();
    console.log('📅 Overdue task check scheduled (every hour)');
  }

  // Send morning reminders (8 AM)
  private async sendMorningReminders() {
    try {
      console.log('🌅 Sending morning reminders (8 AM)...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all users with device tokens
      const users = await User.find({ 
        deviceTokens: { $exists: true, $ne: [] } 
      }).populate('deviceTokens');

      let totalReminders = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          // Get user's tasks due today or overdue
          const tasks = await Task.find({
            $or: [
              { userId: user._id },
              { assignedTo: user._id }
            ],
            completed: false,
            dueDate: { $lte: new Date() } // Due today or overdue
          }).sort({ dueDate: 1 });

          if (tasks.length === 0) continue;

          // Check if morning reminder already sent today
          const reminderKey = `morning-${user._id}-${today.toISOString().split('T')[0]}`;
          if (this.hasNotificationBeenSent(reminderKey)) {
            console.log(`⏭️ Morning reminder already sent to ${user.email}`);
            continue;
          }

          // Send morning reminder
          await this.sendTaskReminder({
            task: tasks[0], // Send reminder for the most urgent task
            user,
            reminderType: 'morning',
            daysUntilDue: this.calculateDaysUntilDue(tasks[0].dueDate)
          }, user.deviceTokens || []);

          this.markNotificationAsSent(reminderKey);
          successCount++;
          totalReminders++;

          console.log(`✅ Morning reminder sent to ${user.email} for ${tasks.length} tasks`);
        } catch (error) {
          console.error(`❌ Error sending morning reminder to ${user.email}:`, error);
          errorCount++;
        }
      }

      console.log(`🌅 Morning reminders completed: ${successCount} sent, ${errorCount} errors`);
    } catch (error) {
      console.error('❌ Error in sendMorningReminders:', error);
    }
  }

  // Send evening reminders (5 PM)
  private async sendEveningReminders() {
    try {
      console.log('🌆 Sending evening reminders (5 PM)...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all users with device tokens
      const users = await User.find({ 
        deviceTokens: { $exists: true, $ne: [] } 
      }).populate('deviceTokens');

      let totalReminders = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          // Get user's incomplete tasks
          const tasks = await Task.find({
            $or: [
              { userId: user._id },
              { assignedTo: user._id }
            ],
            completed: false
          }).sort({ dueDate: 1 });

          if (tasks.length === 0) continue;

          // Check if evening reminder already sent today
          const reminderKey = `evening-${user._id}-${today.toISOString().split('T')[0]}`;
          if (this.hasNotificationBeenSent(reminderKey)) {
            console.log(`⏭️ Evening reminder already sent to ${user.email}`);
            continue;
          }

          // Send evening reminder
          await this.sendTaskReminder({
            task: tasks[0], // Send reminder for the most urgent task
            user,
            reminderType: 'evening',
            daysUntilDue: this.calculateDaysUntilDue(tasks[0].dueDate)
          }, user.deviceTokens || []);

          this.markNotificationAsSent(reminderKey);
          successCount++;
          totalReminders++;

          console.log(`✅ Evening reminder sent to ${user.email} for ${tasks.length} tasks`);
        } catch (error) {
          console.error(`❌ Error sending evening reminder to ${user.email}:`, error);
          errorCount++;
        }
      }

      console.log(`🌆 Evening reminders completed: ${successCount} sent, ${errorCount} errors`);
    } catch (error) {
      console.error('❌ Error in sendEveningReminders:', error);
    }
  }

  // Check and send overdue notifications
  private async checkAndSendOverdueNotifications() {
    try {
      console.log('🔍 Checking for overdue tasks...');
      
      const now = new Date();
      
      // Find overdue tasks
      const overdueTasks = await Task.find({
        completed: false,
        dueDate: { $lt: now }
      }).populate('userId assignedTo');

      let notificationsSent = 0;
      let notificationsSkipped = 0;

      for (const task of overdueTasks) {
        try {
          // Send to task creator
          if (task.userId && typeof task.userId === 'object' && 'deviceTokens' in task.userId) {
            const userId = (task.userId as any)._id.toString();
            const taskId = (task._id as any).toString();
            
            const overdueKey = `overdue-${taskId}-${userId}-${now.toISOString().split('T')[0]}`;
            
            if (!this.hasNotificationBeenSent(overdueKey)) {
              await this.sendTaskReminder({
                task,
                user: task.userId as unknown as IUser,
                reminderType: 'overdue',
                daysUntilDue: this.calculateDaysUntilDue(task.dueDate)
              }, (task.userId as any).deviceTokens || []);

              this.markNotificationAsSent(overdueKey);
              notificationsSent++;
              console.log(`✅ Overdue notification sent to task creator for task ${taskId}`);
            } else {
              notificationsSkipped++;
            }
          }

          // Send to assigned users
          if (task.assignedTo && Array.isArray(task.assignedTo)) {
            for (const assignedUser of task.assignedTo) {
              if (assignedUser && typeof assignedUser === 'object' && 'deviceTokens' in assignedUser) {
                const userId = (assignedUser as any)._id.toString();
                const taskId = (task._id as any).toString();
                
                const overdueKey = `overdue-${taskId}-${userId}-${now.toISOString().split('T')[0]}`;
                
                if (!this.hasNotificationBeenSent(overdueKey)) {
                  await this.sendTaskReminder({
                    task,
                    user: assignedUser as unknown as IUser,
                    reminderType: 'overdue',
                    daysUntilDue: this.calculateDaysUntilDue(task.dueDate)
                  }, (assignedUser as any).deviceTokens || []);

                  this.markNotificationAsSent(overdueKey);
                  notificationsSent++;
                  console.log(`✅ Overdue notification sent to assigned user for task ${taskId}`);
                } else {
                  notificationsSkipped++;
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error sending overdue notification for task ${task._id}:`, error);
        }
      }

      console.log(`🔍 Overdue notifications completed: ${notificationsSent} sent, ${notificationsSkipped} skipped`);
    } catch (error) {
      console.error('❌ Error in checkAndSendOverdueNotifications:', error);
    }
  }

  // Send task reminder via all channels
  private async sendTaskReminder(data: TaskReminderData, deviceTokens: string[] = []): Promise<boolean> {
    const { task, user, reminderType, daysUntilDue } = data;
    
    let title = '';
    let message = '';
    
    // Customize message based on reminder type
    switch (reminderType) {
      case 'morning':
        title = '🌅 Good Morning! Task Reminder';
        message = `You have ${daysUntilDue === 0 ? 'a task due today' : daysUntilDue && daysUntilDue < 0 ? 'overdue tasks' : `${daysUntilDue || 0} days`} to complete "${task.title}". Start your day right!`;
        break;
      case 'evening':
        title = '🌆 Evening Task Check-in';
        message = `Don't forget about "${task.title}"${daysUntilDue === 0 ? ' - due today!' : daysUntilDue && daysUntilDue < 0 ? ' - overdue!' : ` - due in ${daysUntilDue || 0} days`}.`;
        break;
      case 'overdue':
        title = '🚨 Task Overdue!';
        message = `"${task.title}" is overdue by ${Math.abs(daysUntilDue || 0)} days. Please complete it as soon as possible!`;
        break;
    }

    let success = false;

    // Send push notification
    if (deviceTokens.length > 0) {
      try {
        const pushSuccess = await this.pushNotificationService.sendCustomNotification(
          (user._id as any).toString(),
          title,
          message,
          {
            type: 'task_reminder',
            taskId: (task._id as any).toString(),
            reminderType,
            daysUntilDue: daysUntilDue?.toString() || '0'
          },
          deviceTokens
        );
        if (pushSuccess) {
          console.log(`✅ Push notification sent for ${reminderType} reminder`);
          success = true;
        }
      } catch (error) {
        console.error('❌ Error sending push notification:', error);
      }
    }

    // Send WhatsApp notification (if available)
    try {
      if (user.phoneNumber) {
        await this.whatsappService.sendTaskReminder({
          task,
          user,
          daysUntilDue: daysUntilDue || 0
        });
        console.log(`✅ WhatsApp notification sent for ${reminderType} reminder`);
        success = true;
      }
    } catch (error) {
      console.error('❌ Error sending WhatsApp notification:', error);
    }

    // Send email notification (if available)
    try {
      await this.emailService.sendTaskReminder({
        task,
        user,
        daysUntilDue: daysUntilDue || 0
      });
      console.log(`✅ Email notification sent for ${reminderType} reminder`);
      success = true;
    } catch (error) {
      console.error('❌ Error sending email notification:', error);
    }

    return success;
  }

  // Calculate days until due
  private calculateDaysUntilDue(dueDate: Date): number {
    const now = new Date();
    const due = new Date(dueDate);
    
    // Reset time to compare dates only
    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Check if notification has been sent
  private hasNotificationBeenSent(key: string): boolean {
    const record = this.notificationRecords.get(key);
    if (!record) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return record.date === today && record.sent;
  }

  // Mark notification as sent
  private markNotificationAsSent(key: string): void {
    const today = new Date().toISOString().split('T')[0];
    this.notificationRecords.set(key, {
      userId: key.split('-')[1] || '',
      taskId: key.split('-')[2] || '',
      type: key.split('-')[0] as 'morning' | 'evening' | 'overdue',
      date: today,
      sent: true,
      sentAt: new Date()
    });
  }

  // Clean up old notification records (older than 7 days)
  private cleanupOldRecords(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    for (const [key, record] of this.notificationRecords.entries()) {
      if (record.sentAt < sevenDaysAgo) {
        this.notificationRecords.delete(key);
      }
    }
  }

  // Manual trigger for testing
  public async triggerMorningReminders(): Promise<void> {
    console.log('🧪 Manually triggering morning reminders...');
    await this.sendMorningReminders();
  }

  public async triggerEveningReminders(): Promise<void> {
    console.log('🧪 Manually triggering evening reminders...');
    await this.sendEveningReminders();
  }

  public async triggerOverdueCheck(): Promise<void> {
    console.log('🧪 Manually triggering overdue check...');
    await this.checkAndSendOverdueNotifications();
  }

  // Get scheduler status
  public getStatus(): any {
    return {
      active: true,
      notificationRecords: this.notificationRecords.size,
      nextMorningReminder: this.getNextReminderTime(8),
      nextEveningReminder: this.getNextReminderTime(17),
      overdueCheckInterval: 'Every hour'
    };
  }

  private getNextReminderTime(hour: number): string {
    const now = new Date();
    const nextTime = new Date(now);
    nextTime.setHours(hour, 0, 0, 0);
    
    if (now > nextTime) {
      nextTime.setDate(nextTime.getDate() + 1);
    }
    
    return nextTime.toLocaleString();
  }
}

// Global instance
let globalTaskReminderScheduler: TaskReminderScheduler | null = null;

export function getGlobalTaskReminderScheduler(): TaskReminderScheduler | null {
  return globalTaskReminderScheduler;
}

export function initializeGlobalTaskReminderScheduler(): TaskReminderScheduler {
  if (!globalTaskReminderScheduler) {
    globalTaskReminderScheduler = new TaskReminderScheduler();
  }
  return globalTaskReminderScheduler;
} 