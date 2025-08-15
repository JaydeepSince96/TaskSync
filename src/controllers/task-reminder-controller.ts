// src/controllers/task-reminder-controller.ts
import { RequestHandler } from 'express';
import { getGlobalTaskReminderScheduler, initializeGlobalTaskReminderScheduler } from '../services/task-reminder-scheduler';
import { getUserId } from '../utils/auth-types';

export class TaskReminderController {
  
  // Get scheduler status
  getSchedulerStatus: RequestHandler = async (req, res) => {
    try {
      const scheduler = getGlobalTaskReminderScheduler();
      
      if (!scheduler) {
        res.status(404).json({
          success: false,
          message: "Task reminder scheduler not initialized"
        });
        return;
      }

      const status = scheduler.getStatus();
      
      res.status(200).json({
        success: true,
        data: status,
        message: "Scheduler status retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting scheduler status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get scheduler status"
      });
    }
  };

  // Initialize scheduler
  initializeScheduler: RequestHandler = async (req, res) => {
    try {
      const scheduler = initializeGlobalTaskReminderScheduler();
      
      res.status(200).json({
        success: true,
        data: scheduler.getStatus(),
        message: "Task reminder scheduler initialized successfully"
      });
    } catch (error) {
      console.error("Error initializing scheduler:", error);
      res.status(500).json({
        success: false,
        message: "Failed to initialize scheduler"
      });
    }
  };

  // Trigger morning reminders manually (for testing)
  triggerMorningReminders: RequestHandler = async (req, res) => {
    try {
      const scheduler = getGlobalTaskReminderScheduler();
      
      if (!scheduler) {
        res.status(404).json({
          success: false,
          message: "Task reminder scheduler not initialized"
        });
        return;
      }

      await scheduler.triggerMorningReminders();
      
      res.status(200).json({
        success: true,
        message: "Morning reminders triggered successfully"
      });
    } catch (error) {
      console.error("Error triggering morning reminders:", error);
      res.status(500).json({
        success: false,
        message: "Failed to trigger morning reminders"
      });
    }
  };

  // Trigger evening reminders manually (for testing)
  triggerEveningReminders: RequestHandler = async (req, res) => {
    try {
      const scheduler = getGlobalTaskReminderScheduler();
      
      if (!scheduler) {
        res.status(404).json({
          success: false,
          message: "Task reminder scheduler not initialized"
        });
        return;
      }

      await scheduler.triggerEveningReminders();
      
      res.status(200).json({
        success: true,
        message: "Evening reminders triggered successfully"
      });
    } catch (error) {
      console.error("Error triggering evening reminders:", error);
      res.status(500).json({
        success: false,
        message: "Failed to trigger evening reminders"
      });
    }
  };

  // Trigger overdue check manually (for testing)
  triggerOverdueCheck: RequestHandler = async (req, res) => {
    try {
      const scheduler = getGlobalTaskReminderScheduler();
      
      if (!scheduler) {
        res.status(404).json({
          success: false,
          message: "Task reminder scheduler not initialized"
        });
        return;
      }

      await scheduler.triggerOverdueCheck();
      
      res.status(200).json({
        success: true,
        message: "Overdue check triggered successfully"
      });
    } catch (error) {
      console.error("Error triggering overdue check:", error);
      res.status(500).json({
        success: false,
        message: "Failed to trigger overdue check"
      });
    }
  };

  // Get user's upcoming task reminders
  getUserTaskReminders: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      // Get user's tasks with due dates
      const Task = require('../models/task-model').default;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Get tasks due today, tomorrow, and next week
      const tasksDueToday = await Task.find({
        $or: [
          { userId: userId },
          { assignedTo: userId }
        ],
        completed: false,
        dueDate: {
          $gte: today,
          $lt: tomorrow
        }
      }).sort({ dueDate: 1 });

      const tasksDueTomorrow = await Task.find({
        $or: [
          { userId: userId },
          { assignedTo: userId }
        ],
        completed: false,
        dueDate: {
          $gte: tomorrow,
          $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
        }
      }).sort({ dueDate: 1 });

      const tasksDueNextWeek = await Task.find({
        $or: [
          { userId: userId },
          { assignedTo: userId }
        ],
        completed: false,
        dueDate: {
          $gte: tomorrow,
          $lte: nextWeek
        }
      }).sort({ dueDate: 1 });

      const overdueTasks = await Task.find({
        $or: [
          { userId: userId },
          { assignedTo: userId }
        ],
        completed: false,
        dueDate: { $lt: today }
      }).sort({ dueDate: 1 });

      res.status(200).json({
        success: true,
        data: {
          overdue: overdueTasks.length,
          dueToday: tasksDueToday.length,
          dueTomorrow: tasksDueTomorrow.length,
          dueNextWeek: tasksDueNextWeek.length,
          tasks: {
            overdue: overdueTasks,
            dueToday: tasksDueToday,
            dueTomorrow: tasksDueTomorrow,
            dueNextWeek: tasksDueNextWeek
          }
        },
        message: "Task reminders retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting user task reminders:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get task reminders"
      });
    }
  };
} 