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

// GET /api/notifications/health - Public health check (no auth required)
notificationRouter.get('/health', notificationController.healthCheck);

// Apply authentication to all routes below this point
notificationRouter.use(authenticateToken);

// GET /api/notifications/status - Get status of all notification services
notificationRouter.get('/status', notificationController.getServicesStatus);

// GET /api/notifications/preferences - Get user notification preferences
notificationRouter.get('/preferences', notificationController.getPreferences);

// POST /api/notifications/preferences - Update user notification preferences
notificationRouter.post('/preferences', notificationController.updatePreferences);

export { notificationRouter };
