// src/routes/notification-route.ts
import express from 'express';
import notificationManager from '../services/notification-manager';
import { authenticateToken } from '../middleware/auth-middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/notifications/status - Get status of all notification services
router.get('/status', (req, res) => {
  try {
    const status = notificationManager.getServicesStatus();
    
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
});

export default router;
