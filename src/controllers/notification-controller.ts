// src/controllers/notification-controller.ts
import { Request, Response, RequestHandler } from 'express';
import { NotificationManager } from '../services/notification-manager';
import { WhatsAppService } from '../services/whatsapp-service';
import { EmailService } from '../services/email-service';
import { PushNotificationService } from '../services/push-notification-service';
import TaskModel from '../models/task-model';
import { User } from '../models/user-model';
import { getUserId } from '../utils/auth-types';

export class NotificationController {
  constructor(
    private notificationManager: NotificationManager,
    private whatsappService: WhatsAppService,
    private emailService: EmailService,
    private pushNotificationService: PushNotificationService
  ) {}

  // GET /api/notifications/status - Get status of all notification services
  getServicesStatus: RequestHandler = async (req, res) => {
    try {
      const status = this.notificationManager.getServicesStatus();
      
      res.json({
        success: true,
        message: 'Notification services status retrieved successfully',
        data: status
      });
    } catch (error) {
      console.error('Error getting notification status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/notifications/test - Test all notification services
  testAllServices: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const { phoneNumber, deviceTokens } = req.body;

      const testData = {
        email: user.email,
        phoneNumber: phoneNumber || user.phoneNumber,
        deviceTokens: deviceTokens || []
      };

      const results = await this.notificationManager.testAllServices(testData);

      res.json({
        success: true,
        message: 'Notification services tested',
        data: results
      });
    } catch (error) {
      console.error('Error testing notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/notifications/whatsapp/test - Test WhatsApp service specifically
  testWhatsApp: RequestHandler = async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
        return;
      }

      // WhatsApp test functionality removed - not needed for production
      const result = false;

      res.json({
        success: result,
        message: result ? 'WhatsApp test message sent successfully' : 'Failed to send WhatsApp test message',
        data: { sent: result }
      });
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test WhatsApp service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/notifications/email/test - Test Email service specifically
  testEmail: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const { email } = req.body;
      const targetEmail = email || user.email;

      const result = await this.emailService.sendTestEmail(targetEmail);

      res.json({
        success: result,
        message: result ? 'Test email sent successfully' : 'Failed to send test email',
        data: { sent: result, email: targetEmail }
      });
    } catch (error) {
      console.error('Error testing email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test email service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/notifications/push/test - Test Push notification service specifically
  testPushNotifications: RequestHandler = async (req, res) => {
    try {
      const { deviceTokens } = req.body;
      
      if (!deviceTokens || !Array.isArray(deviceTokens) || deviceTokens.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Device tokens array is required'
        });
        return;
      }

      const result = await this.pushNotificationService.sendTestNotification(deviceTokens);

      res.json({
        success: result,
        message: result ? 'Push test notification sent successfully' : 'Failed to send push test notification',
        data: { sent: result, deviceCount: deviceTokens.length }
      });
    } catch (error) {
      console.error('Error testing push notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test push notification service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/notifications/task-reminder/:taskId - Send manual task reminder
  sendTaskReminder: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      const { taskId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await User.findById(userId);
      const task = await TaskModel.findOne({ _id: taskId, userId });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found or does not belong to user'
        });
        return;
      }

      if (task.completed) {
        res.status(400).json({
          success: false,
          message: 'Cannot send reminder for completed task'
        });
        return;
      }

      // Calculate days until due
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      const result = await this.notificationManager.sendTaskReminder({
        task,
        user,
        daysUntilDue
      });

      res.json({
        success: result.success,
        message: result.success ? 'Task reminder sent successfully' : 'Failed to send task reminder',
        data: {
          taskTitle: task.title,
          daysUntilDue,
          sentVia: result.sentVia,
          errors: result.errors
        }
      });
    } catch (error) {
      console.error('Error sending task reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send task reminder',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/notifications/weekly-report - Send manual weekly report
  sendWeeklyReport: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
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

      // Generate report for the current week
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekNumber = Math.ceil(now.getDate() / 7);

      // Get user's tasks for the week
      const weekTasks = await TaskModel.find({
        userId: user._id,
        createdAt: { $gte: weekStart, $lte: now }
      });

      const completedTasks = weekTasks.filter((task: any) => task.completed).length;
      const overdueTasks = weekTasks.filter((task: any) => 
        !task.completed && new Date(task.dueDate) < now
      ).length;

      const stats = {
        totalTasks: weekTasks.length,
        completedTasks,
        overdueTasks,
        pendingTasks: weekTasks.length - completedTasks - overdueTasks
      };

      // Generate insights
      const insights = this.generateWeeklyInsights(stats, weekTasks);

      const result = await this.notificationManager.sendWeeklyReport({
        user,
        stats,
        period: {
          startDate: weekStart,
          endDate: now,
          weekNumber
        },
        insights
      });

      res.json({
        success: result.success,
        message: result.success ? 'Weekly report sent successfully' : 'Failed to send weekly report',
        data: {
          weekNumber,
          stats,
          sentVia: result.sentVia,
          errors: result.errors
        }
      });
    } catch (error) {
      console.error('Error sending weekly report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send weekly report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/notifications/custom - Send custom notification
  sendCustomMessage: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      const { title, message, channels } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!title || !message) {
        res.status(400).json({
          success: false,
          message: 'Title and message are required'
        });
        return;
      }

      const result = await this.notificationManager.sendCustomMessage(
        userId,
        title,
        message,
        channels || ['whatsapp', 'email', 'push']
      );

      res.json({
        success: result.success,
        message: result.success ? 'Custom notification sent successfully' : 'Failed to send custom notification',
        data: {
          title,
          sentVia: result.sentVia,
          errors: result.errors
        }
      });
    } catch (error) {
      console.error('Error sending custom notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send custom notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // POST /api/notifications/preferences - Update user notification preferences
  updatePreferences: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      const { preferences } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!preferences) {
        res.status(400).json({
          success: false,
          message: 'Preferences object is required'
        });
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { notificationPreferences: preferences },
        { new: true }
      );

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: { preferences: user.notificationPreferences }
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // GET /api/notifications/preferences - Get user notification preferences
  getPreferences: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
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

      const defaultPreferences = {
        whatsapp: true,
        email: true,
        push: true,
        taskReminders: true,
        weeklyReports: true,
        customMessages: true
      };

      res.json({
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: { preferences: user.notificationPreferences || defaultPreferences }
      });
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification preferences',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // GET /api/notifications/health - Public health check (no auth required)
  healthCheck: RequestHandler = async (req, res) => {
    try {
      // Check for all email providers
      const hasAWSSES = !!(process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY && process.env.AWS_SES_FROM_EMAIL);
      const hasSendGrid = !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
      const hasMailgun = !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN && process.env.MAILGUN_FROM_EMAIL);
      const hasLegacySMTP = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
      
      const emailConfigured = hasAWSSES || hasSendGrid || hasMailgun || hasLegacySMTP;
      let emailProvider = 'none';
      
      if (hasAWSSES) emailProvider = 'aws_ses';
      else if (hasSendGrid) emailProvider = 'sendgrid';
      else if (hasMailgun) emailProvider = 'mailgun';
      else if (hasLegacySMTP) emailProvider = 'smtp';

      const services = {
        whatsapp: {
          enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
          configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
          status: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
            ? 'ready' 
            : 'credentials_missing'
        },
        email: {
          enabled: emailConfigured,
          configured: emailConfigured,
          status: emailConfigured ? 'ready' : 'credentials_missing',
          provider: emailProvider,
          providers: {
            aws_ses: hasAWSSES,
            sendgrid: hasSendGrid,
            mailgun: hasMailgun,
            smtp: hasLegacySMTP
          }
        },
        push: {
          enabled: !!(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY),
          configured: !!(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY),
          status: !!(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY) 
            ? 'ready' 
            : 'credentials_missing'
        }
      };

      const totalServices = 3;
      const enabledServices = Object.values(services).filter(service => service.enabled).length;
      const overallStatus = enabledServices === totalServices 
        ? 'all_ready' 
        : enabledServices > 0 
          ? 'partial' 
          : 'needs_setup';

      res.json({
        success: true,
        message: 'Notification services health check',
        data: {
          overall: {
            status: overallStatus,
            ready: enabledServices,
            total: totalServices,
            percentage: Math.round((enabledServices / totalServices) * 100)
          },
          services,
          setup_guide: 'See NOTIFICATION_SETUP_GUIDE.md for configuration instructions',
          test_mode: process.env.NOTIFICATION_TEST_MODE === 'true'
        }
      });
    } catch (error) {
      console.error('Error in health check:', error);
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Helper function to generate weekly insights
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

    return insights;
  }
}
