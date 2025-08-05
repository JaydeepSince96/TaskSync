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

// Get notification schedule for a user
router.get('/schedule/:userId', authenticateToken, whatsappController.getNotificationSchedule);

export default router; 