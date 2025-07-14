// src/routes/notification-route.ts
import express from 'express';
import NotificationController from '../controllers/notification-controller';

const router = express.Router();
const notificationController = new NotificationController();

// GET /api/notifications/health - Public health check (no auth required)
router.get('/health', notificationController.healthCheck);

// GET /api/notifications/status - Get status of all notification services
router.get('/status', notificationController.getServicesStatus);

// POST /api/notifications/test - Test all notification services
router.post('/test', notificationController.testAllServices);

// POST /api/notifications/whatsapp/test - Test WhatsApp service specifically
router.post('/whatsapp/test', notificationController.testWhatsApp);

// POST /api/notifications/email/test - Test Email service specifically
router.post('/email/test', notificationController.testEmail);

// POST /api/notifications/push/test - Test Push notification service specifically
router.post('/push/test', notificationController.testPushNotifications);

// POST /api/notifications/task-reminder/:taskId - Send manual task reminder
router.post('/task-reminder/:taskId', notificationController.sendTaskReminder);

// POST /api/notifications/weekly-report - Send manual weekly report
router.post('/weekly-report', notificationController.sendWeeklyReport);

// POST /api/notifications/custom - Send custom notification
router.post('/custom', notificationController.sendCustomMessage);

// GET /api/notifications/preferences - Get user notification preferences
router.get('/preferences', notificationController.getPreferences);

// POST /api/notifications/preferences - Update user notification preferences
router.post('/preferences', notificationController.updatePreferences);

export default router;
