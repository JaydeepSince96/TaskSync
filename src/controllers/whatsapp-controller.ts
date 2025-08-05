// src/controllers/whatsapp-controller.ts
import { Request, Response, RequestHandler } from 'express';
import { WhatsAppService } from '../services/whatsapp-service';
import { NotificationScheduler } from '../services/notification-scheduler';
import Task from '../models/task-model';
import { User } from '../models/user-model';

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