// src/routes/whatsapp-route.ts
import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp-controller';
import { authenticateToken } from '../middleware/auth-middleware';

const router = Router();
const whatsappController = new WhatsAppController();

// WhatsApp test endpoints removed - not needed for production

// Get WhatsApp service status (public for debugging)
router.get('/status', whatsappController.getStatus);

// Send custom WhatsApp message
router.post('/send-message', authenticateToken, whatsappController.sendCustomMessage);

// Send task deadline notification manually
router.post('/deadline-notification', authenticateToken, whatsappController.sendTaskDeadlineNotification);

// Send daily reminder manually
router.post('/daily-reminder', authenticateToken, whatsappController.sendDailyReminder);

// Manually trigger daily reminder for testing
router.post('/trigger-daily-reminder', authenticateToken, whatsappController.triggerDailyReminder);

// Manually trigger daily reminders for all users
router.post('/trigger-daily-reminders-all', authenticateToken, whatsappController.triggerDailyRemindersForAll);

// Get all users with phone numbers for debugging
router.get('/users-with-phone', authenticateToken, whatsappController.getUsersWithPhoneNumbers);

// Comprehensive debugging endpoint
router.get('/debug/:userId?', authenticateToken, whatsappController.debugWhatsAppSystem);

// Troubleshoot notification issues for a specific user
router.get('/troubleshoot/:userId', authenticateToken, whatsappController.troubleshootNotifications);

// Clear notification records for testing
router.post('/clear-notification-records', authenticateToken, whatsappController.clearNotificationRecords);

// Get notification tracking status
router.get('/notification-tracking-status', authenticateToken, whatsappController.getNotificationTrackingStatus);

// Get notification schedule for a user
router.get('/schedule/:userId', authenticateToken, whatsappController.getNotificationSchedule);

export default router; 