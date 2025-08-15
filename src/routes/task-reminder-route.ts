// src/routes/task-reminder-route.ts
import { Router } from 'express';
import { TaskReminderController } from '../controllers/task-reminder-controller';
import { authenticateToken } from '../middleware/auth-middleware';

const router = Router();
const taskReminderController = new TaskReminderController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get scheduler status
router.get('/status', taskReminderController.getSchedulerStatus);

// Initialize scheduler
router.post('/initialize', taskReminderController.initializeScheduler);

// Get user's task reminders
router.get('/user-reminders', taskReminderController.getUserTaskReminders);

// Manual trigger endpoints (for testing)
router.post('/trigger/morning', taskReminderController.triggerMorningReminders);
router.post('/trigger/evening', taskReminderController.triggerEveningReminders);
router.post('/trigger/overdue', taskReminderController.triggerOverdueCheck);

export default router; 