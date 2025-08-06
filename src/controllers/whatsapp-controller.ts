// src/controllers/whatsapp-controller.ts
import { Request, Response, RequestHandler } from 'express';
import { WhatsAppService } from '../services/whatsapp-service';
import { NotificationScheduler } from '../services/notification-scheduler';
import Task from '../models/task-model';
import { User } from '../models/user-model';
import { getGlobalNotificationScheduler } from '../services/notification-scheduler';

export class WhatsAppController {
  private whatsappService: WhatsAppService;
  private notificationScheduler: NotificationScheduler;

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.notificationScheduler = new NotificationScheduler();
  }

  // WhatsApp test functionality removed - not needed for production

  // Get WhatsApp service status
  public getStatus: RequestHandler = async (req, res) => {
    try {
      const status = this.whatsappService.getStatus();
      const schedulerStatus = this.notificationScheduler.getStatus();

      // Add environment variable check for debugging
      const envCheck = {
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set',
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set',
        TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || 'Not set',
        NODE_ENV: process.env.NODE_ENV || 'Not set'
      };

      res.status(200).json({
        success: true,
        data: {
          whatsapp: status,
          scheduler: schedulerStatus,
          environment: envCheck
        }
      });
    } catch (error) {
      console.error('Error getting WhatsApp status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Send custom WhatsApp message
  public sendCustomMessage: RequestHandler = async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        res.status(400).json({
          success: false,
          message: 'Phone number and message are required'
        });
        return;
      }

      const result = await this.whatsappService.sendCustomMessage(phoneNumber, message);

      if (result) {
        res.status(200).json({
          success: true,
          message: 'Custom WhatsApp message sent successfully',
          data: {
            phoneNumber,
            message,
            status: 'sent'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send custom WhatsApp message'
        });
      }
    } catch (error) {
      console.error('Error sending custom WhatsApp message:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Send task deadline notification manually
  public sendTaskDeadlineNotification: RequestHandler = async (req, res) => {
    try {
      const { taskId, userId } = req.body;

      if (!taskId || !userId) {
        res.status(400).json({
          success: false,
          message: 'Task ID and User ID are required'
        });
        return;
      }

      const task = await Task.findById(taskId);
      const user = await User.findById(userId);

      if (!task || !user) {
        res.status(404).json({
          success: false,
          message: 'Task or user not found'
        });
        return;
      }

      const isDeadline = this.isSameDay(task.startDate, task.dueDate);
      const result = await this.whatsappService.sendTaskDeadlineNotification({
        task,
        user,
        isDeadline
      });

      if (result) {
        res.status(200).json({
          success: true,
          message: 'Task deadline notification sent successfully',
          data: {
            taskId,
            userId,
            isDeadline,
            status: 'sent'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send task deadline notification'
        });
      }
    } catch (error) {
      console.error('Error sending task deadline notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Send daily reminder manually
  public sendDailyReminder: RequestHandler = async (req, res) => {
    try {
      const { userId, time = '10am' } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const tasks = await Task.find({
        $or: [
          { userId: user._id },
          { assignedTo: user._id }
        ]
      }).sort({ dueDate: 1 });

      const result = await this.whatsappService.sendDailyReminder({
        user,
        tasks,
        reminderTime: time as '10am' | '3pm' | '7pm'
      });

      if (result) {
        res.status(200).json({
          success: true,
          message: 'Daily reminder sent successfully',
          data: {
            userId,
            time,
            taskCount: tasks.length,
            status: 'sent'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send daily reminder'
        });
      }
    } catch (error) {
      console.error('Error sending daily reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Manually trigger daily reminder for testing
  public triggerDailyReminder: RequestHandler = async (req, res) => {
    try {
      const { userId, time = '10am' } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (!user.phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'User has no phone number configured'
        });
        return;
      }

      // Get user's tasks
      const tasks = await Task.find({
        $or: [
          { userId: user._id },
          { assignedTo: user._id }
        ]
      }).sort({ dueDate: 1 });

      console.log(`🔍 Found ${tasks.length} tasks for user ${user.email}`);
      console.log(`📱 Sending manual daily reminder (${time}) to ${user.phoneNumber}`);

      const result = await this.whatsappService.sendDailyReminder({
        user,
        tasks,
        reminderTime: time as '10am' | '3pm' | '7pm'
      });

      if (result) {
        res.status(200).json({
          success: true,
          message: `Daily reminder (${time}) sent successfully`,
          data: {
            userId,
            phoneNumber: user.phoneNumber,
            tasksCount: tasks.length,
            pendingTasks: tasks.filter(t => !t.completed).length,
            completedTasks: tasks.filter(t => t.completed).length,
            time
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send daily reminder'
        });
      }
    } catch (error) {
      console.error('Error triggering daily reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Manually trigger daily reminders for all users
  public triggerDailyRemindersForAll: RequestHandler = async (req, res) => {
    try {
      const { time = '10am' } = req.body;

      console.log(`🔧 Manually triggering daily reminders (${time}) for all users...`);

      const notificationScheduler = getGlobalNotificationScheduler();
      if (!notificationScheduler) {
        res.status(500).json({
          success: false,
          message: 'Notification scheduler not initialized'
        });
        return;
      }

      await notificationScheduler.triggerDailyReminders(time as '10am' | '3pm' | '7pm');

      res.status(200).json({
        success: true,
        message: `Daily reminders (${time}) triggered for all users`,
        data: {
          time,
          status: 'triggered'
        }
      });
    } catch (error) {
      console.error('Error triggering daily reminders for all users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get notification schedule for a user
  public getNotificationSchedule: RequestHandler = async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const tasks = await Task.find({
        $or: [
          { userId: user._id },
          { assignedTo: user._id }
        ]
      }).sort({ dueDate: 1 });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tasksDueToday = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      });

      const deadlineTasks = tasksDueToday.filter(task => 
        this.isSameDay(task.startDate, task.dueDate)
      );

      res.status(200).json({
        success: true,
        data: {
          userId,
          totalTasks: tasks.length,
          tasksDueToday: tasksDueToday.length,
          deadlineTasks: deadlineTasks.length,
          dailyReminders: ['10am', '3pm', '7pm'],
          nextReminders: this.getNextReminderTimes()
        }
      });
    } catch (error) {
      console.error('Error getting notification schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get all users with phone numbers for debugging
  public getUsersWithPhoneNumbers: RequestHandler = async (req, res) => {
    try {
      const users = await User.find({ 
        phoneNumber: { $exists: true, $ne: '' } 
      }).select('_id name email phoneNumber');

      const usersWithTasks = await Promise.all(
        users.map(async (user) => {
          const tasks = await Task.find({
            $or: [
              { userId: user._id },
              { assignedTo: user._id }
            ]
          });

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            totalTasks: tasks.length,
            pendingTasks: tasks.filter(t => !t.completed).length,
            completedTasks: tasks.filter(t => t.completed).length
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          totalUsers: usersWithTasks.length,
          users: usersWithTasks
        }
      });
    } catch (error) {
      console.error('Error getting users with phone numbers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Comprehensive debugging endpoint for WhatsApp notifications
  public debugWhatsAppSystem: RequestHandler = async (req, res) => {
    try {
      const { userId } = req.params;

      console.log('🔍 Debugging WhatsApp notification system...');

      // 1. Check WhatsApp service status
      const whatsappStatus = this.whatsappService.getStatus();
      console.log('📱 WhatsApp Service Status:', whatsappStatus);

      // 2. Check notification scheduler status
      const notificationScheduler = getGlobalNotificationScheduler();
      const schedulerStatus = notificationScheduler ? notificationScheduler.getStatus() : null;
      console.log('⏰ Scheduler Status:', schedulerStatus);

      // 3. Get user information if provided
      let userInfo: any = null;
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          userInfo = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            hasPhoneNumber: !!user.phoneNumber
          };

          // Get user's tasks
          const tasks = await Task.find({
            $or: [
              { userId: user._id },
              { assignedTo: user._id }
            ]
          }).sort({ dueDate: 1 });

          userInfo.tasks = {
            total: tasks.length,
            pending: tasks.filter(t => !t.completed).length,
            completed: tasks.filter(t => t.completed).length,
            tasks: tasks.map(t => ({
              _id: t._id,
              title: t.title,
              completed: t.completed,
              startDate: t.startDate,
              dueDate: t.dueDate,
              isDeadline: this.isSameDay(t.startDate, t.dueDate)
            }))
          };
        }
      }

      // 4. Get all users with phone numbers
      const usersWithPhone = await User.find({ 
        phoneNumber: { $exists: true, $ne: '' } 
      }).select('_id name email phoneNumber');

      // 5. Get recent tasks for deadline checking
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tasksDueToday = await Task.find({
        dueDate: {
          $gte: today,
          $lt: tomorrow
        },
        completed: false
      }).populate('userId assignedTo');

      const debugInfo = {
        timestamp: new Date().toISOString(),
        whatsappService: {
          isAvailable: this.whatsappService.isAvailable(),
          status: whatsappStatus,
          credentials: {
            accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set',
            authToken: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set',
            fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
          }
        },
        notificationScheduler: {
          isInitialized: !!notificationScheduler,
          status: schedulerStatus,
          dailyReminders: ['10am', '3pm', '7pm'],
          nextReminders: this.getNextReminderTimes()
        },
        users: {
          totalWithPhone: usersWithPhone.length,
          usersWithPhone: usersWithPhone.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            phoneNumber: u.phoneNumber
          }))
        },
        tasks: {
          dueToday: tasksDueToday.length,
          deadlineTasks: tasksDueToday.filter(t => this.isSameDay(t.startDate, t.dueDate)).length,
          regularTasks: tasksDueToday.filter(t => !this.isSameDay(t.startDate, t.dueDate)).length
        },
        userInfo
      };

      console.log('🔍 Debug information collected:', debugInfo);

      res.status(200).json({
        success: true,
        message: 'WhatsApp system debug information',
        data: debugInfo
      });
    } catch (error) {
      console.error('Error debugging WhatsApp system:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Help users troubleshoot WhatsApp notification issues
  public troubleshootNotifications: RequestHandler = async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Get user's tasks
      const tasks = await Task.find({
        $or: [
          { userId: user._id },
          { assignedTo: user._id }
        ]
      }).sort({ dueDate: 1 });

      // Check WhatsApp service status
      const whatsappAvailable = this.whatsappService.isAvailable();
      const whatsappStatus = this.whatsappService.getStatus();

      // Check notification scheduler
      const notificationScheduler = getGlobalNotificationScheduler();
      const schedulerStatus = notificationScheduler ? notificationScheduler.getStatus() : null;

      // Generate troubleshooting report
      const issues = [];
      const recommendations = [];

      // Check if user has phone number
      if (!user.phoneNumber) {
        issues.push('No phone number configured');
        recommendations.push('Add your phone number in international format (e.g., +1234567890) in your profile settings');
      }

      // Check if WhatsApp service is available
      if (!whatsappAvailable) {
        issues.push('WhatsApp service not available');
        recommendations.push('Contact support - WhatsApp service needs to be configured');
      }

      // Check if user has tasks
      if (tasks.length === 0) {
        issues.push('No tasks found');
        recommendations.push('Create some tasks to receive notifications');
      }

      // Check if notification scheduler is running
      if (!notificationScheduler) {
        issues.push('Notification scheduler not running');
        recommendations.push('Contact support - notification system needs to be restarted');
      }

      // Check for tasks due today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tasksDueToday = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      });

      const deadlineTasks = tasksDueToday.filter(task => 
        this.isSameDay(task.startDate, task.dueDate)
      );

      const troubleshootingReport = {
        userInfo: {
          _id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          hasPhoneNumber: !!user.phoneNumber
        },
        taskInfo: {
          total: tasks.length,
          pending: tasks.filter(t => !t.completed).length,
          completed: tasks.filter(t => t.completed).length,
          dueToday: tasksDueToday.length,
          deadlineTasks: deadlineTasks.length
        },
        system: {
          whatsappAvailable,
          whatsappStatus,
          schedulerRunning: !!notificationScheduler,
          schedulerStatus
        },
        issues,
        recommendations,
        nextSteps: [
          '1. Add your phone number in profile settings if not already done',
          '2. Create some tasks with different start and due dates',
          '3. Wait for the next scheduled reminder (10am, 3pm, or 7pm)',
          '4. Use the manual trigger endpoints to test notifications',
          '5. Check the debug endpoint for detailed system status'
        ]
      };

      res.status(200).json({
        success: true,
        message: 'Troubleshooting report generated',
        data: troubleshootingReport
      });
    } catch (error) {
      console.error('Error generating troubleshooting report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Clear notification records for testing
  public clearNotificationRecords: RequestHandler = async (req, res) => {
    try {
      const notificationScheduler = getGlobalNotificationScheduler();
      if (!notificationScheduler) {
        res.status(500).json({
          success: false,
          message: 'Notification scheduler not initialized'
        });
        return;
      }

      notificationScheduler.clearNotificationRecords();

      res.status(200).json({
        success: true,
        message: 'Notification records cleared successfully',
        data: {
          status: 'cleared',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error clearing notification records:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get notification tracking status
  public getNotificationTrackingStatus: RequestHandler = async (req, res) => {
    try {
      const notificationScheduler = getGlobalNotificationScheduler();
      if (!notificationScheduler) {
        res.status(500).json({
          success: false,
          message: 'Notification scheduler not initialized'
        });
        return;
      }

      const trackingStatus = notificationScheduler.getNotificationTrackingStatus();

      res.status(200).json({
        success: true,
        message: 'Notification tracking status retrieved',
        data: {
          trackingStatus,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting notification tracking status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Helper method to check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // Helper method to get next reminder times
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

      if (nextReminder <= now) {
        nextReminder.setDate(nextReminder.getDate() + 1);
      }

      return {
        time,
        nextOccurrence: nextReminder.toISOString()
      };
    });
  }
} 