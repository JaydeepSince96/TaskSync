// src/routes/notification-route.ts
import express from 'express';
import { NotificationController } from '../controllers/notification-controller';
import { authenticateToken } from '../middleware/auth-middleware';
import { NotificationManager } from '../services/notification-manager';
import { WhatsAppService } from '../services/whatsapp-service';
import { EmailService } from '../services/email-service';
import { PushNotificationService } from '../services/push-notification-service';

const notificationManager = new NotificationManager();
const whatsappService = new WhatsAppService();
const emailService = new EmailService();
const pushNotificationService = new PushNotificationService();
const notificationController = new NotificationController(notificationManager, whatsappService, emailService, pushNotificationService);

const notificationRouter = express.Router();

// Simple test endpoint (no auth)
notificationRouter.get('/test-public', (req, res) => {
  res.json({
    success: true,
    message: "Public endpoint working",
    timestamp: new Date().toISOString()
  });
});

// GET /api/notifications/health - Public health check (no auth required)
notificationRouter.get('/health', notificationController.healthCheck);

// Apply authentication to all routes below this point
notificationRouter.use(authenticateToken);

// GET /api/notifications/status - Get status of all notification services
notificationRouter.get('/status', notificationController.getServicesStatus);

// POST /api/notifications/test - Test all notification services
notificationRouter.post('/test', notificationController.testAllServices);

// POST /api/notifications/whatsapp/test - Test WhatsApp service specifically
notificationRouter.post('/whatsapp/test', notificationController.testWhatsApp);

// POST /api/notifications/email/test - Test Email service specifically
notificationRouter.post('/email/test', notificationController.testEmail);

// POST /api/notifications/push/test - Test Push notification service specifically
notificationRouter.post('/push/test', notificationController.testPushNotifications);

// POST /api/notifications/task-reminder/:taskId - Send manual task reminder
notificationRouter.post('/task-reminder/:taskId', notificationController.sendTaskReminder);

// POST /api/notifications/weekly-report - Send manual weekly report
notificationRouter.post('/weekly-report', notificationController.sendWeeklyReport);

// POST /api/notifications/custom - Send custom notification
notificationRouter.post('/custom', notificationController.sendCustomMessage);

// GET /api/notifications/preferences - Get user notification preferences
notificationRouter.get('/preferences', notificationController.getPreferences);

// POST /api/notifications/preferences - Update user notification preferences
notificationRouter.post('/preferences', notificationController.updatePreferences);

export { notificationRouter };
