// src/controllers/TodoController.ts
import { Request, Response, RequestHandler } from "express";
import { TaskService } from "../services/task-service";
import { TaskLabel } from "../models/task-model";
import { getUserId } from "../utils/auth-types";
import { parseDateFromDDMMYYYY, formatDateToDDMMYYYY, formatDateWithTime } from "../utils/date-utils";
import { getGlobalNotificationScheduler } from "../services/notification-scheduler";
import { User } from "../models/user-model";
import { WhatsAppService } from "../services/whatsapp-service";

export class TaskController {
  constructor(private taskService: TaskService) {}

  // Helper function to format date (using DD/MM/YYYY format for consistency)
  private formatDate(date: Date): string {
    return formatDateToDDMMYYYY(date);
  }

  // Helper function to format todo response
  private formatTaskResponse(todo: any) {
    return {
      ...todo.toObject(),
      startDate: this.formatDate(new Date(todo.startDate)),
      dueDate: this.formatDate(new Date(todo.dueDate)),
      createdAt: formatDateWithTime(new Date(todo.createdAt)),
      updatedAt: formatDateWithTime(new Date(todo.updatedAt))
    };
  }

  // Helper function to check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // Get available label options
  GetLabelOptions: RequestHandler = async (req, res) => {
    try {
      const labels = Object.values(TaskLabel).map(label => ({
        value: label,
        label: label.charAt(0).toUpperCase() + label.slice(1)
      }));
      res.status(200).json({ success: true, data: labels });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error fetching label options: ${error}`,
      });
    }
  };

  // Get all task
  GetAllTask: RequestHandler = async (req, res) => {
    try {
      console.log("GetAllTask endpoint hit");
      const userId = getUserId(req);
      
      console.log("User ID from request:", userId);
      
      if (!userId) {
        console.log("No user ID found - authentication required");
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      console.log("Fetching tasks for user:", userId);
      const todos = await this.taskService.getAllTask(userId);
      
      console.log("Tasks fetched successfully, count:", todos?.length || 0);
      
      if (!todos || todos.length === 0) {
        res.status(200).json({ 
          success: true, 
          data: [],
          message: "No tasks found" 
        });
        return;
      }
      
      const formattedTodos = todos.map(todo => this.formatTaskResponse(todo));
      console.log("Tasks formatted successfully");
      res.status(200).json({ success: true, data: formattedTodos });
    } catch (error) {
      console.error("Error in GetAllTask:", error);
      res.status(500).json({
        success: false,
        message: `Error fetching todos: ${error}`,
      });
    }
  };

  // Get single task by ID
  GetTaskById: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      if (!id) {
        res.status(400).json({ success: false, message: "Task ID is required" });
        return;
      }

      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const task = await this.taskService.getTaskById(id, userId);
      if (!task) {
        res.status(404).json({ success: false, message: "Task not found" });
        return;
      }

      const formattedTask = this.formatTaskResponse(task);
      res.status(200).json({ success: true, data: formattedTask });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error fetching task: ${error}`,
      });
    }
  };

  // Get filtered tasks
  GetFilteredTasks: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const {
        searchId,
        priority,
        status,
        startDate,
        endDate,
        page = '1',
        limit = '10'
      } = req.query;

      const filters = {
        searchId: searchId as string,
        priority: priority as string,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      };

      const result = await this.taskService.getFilteredTasks(userId, filters);
      
      const formattedTasks = result.tasks.map(task => this.formatTaskResponse(task));
      
      res.status(200).json({
        success: true,
        data: {
          tasks: formattedTasks,
          pagination: {
            totalCount: result.totalCount,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            hasNextPage: result.currentPage < result.totalPages,
            hasPrevPage: result.currentPage > 1
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error fetching filtered tasks: ${error}`,
      });
    }
  };

  // Create a new task
  CreateNewTask: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const { title, label, startDate, dueDate, assignedTo } = req.body;
      
      if (!dueDate || !startDate) {
        res.status(400).json({ 
          success: false, 
          message: "Both start date and due date are required" 
        });
        return;
      }

      // Parse start date (beginning of day)
      let parsedStartDate: Date;
      if (typeof startDate === 'string') {
        try {
          parsedStartDate = parseDateFromDDMMYYYY(startDate, false);
        } catch (error) {
          res.status(400).json({ 
            success: false, 
            message: "Invalid start date format. Use DD/MM/YYYY" 
          });
          return;
        }
      } else {
        parsedStartDate = new Date(startDate);
        parsedStartDate.setHours(0, 0, 0, 0);
      }

      // Parse due date (end of day)
      let parsedDueDate: Date;
      if (typeof dueDate === 'string') {
        try {
          parsedDueDate = parseDateFromDDMMYYYY(dueDate, true);
        } catch (error) {
          res.status(400).json({ 
            success: false, 
            message: "Invalid due date format. Use DD/MM/YYYY" 
          });
          return;
        }
      } else {
        parsedDueDate = new Date(dueDate);
        parsedDueDate.setHours(23, 59, 59, 999);
      }

      // Validate parsed dates
      if (isNaN(parsedStartDate.getTime())) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid start date" 
        });
        return;
      }

      if (isNaN(parsedDueDate.getTime())) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid due date" 
        });
        return;
      }

      // Check if due date is before start date (allow same day)
      if (parsedStartDate > parsedDueDate) {
        res.status(400).json({ 
          success: false, 
          message: "Due date cannot be before start date" 
        });
        return;
      }

      if (!Object.values(TaskLabel).includes(label)) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid label. Must be one of: low priority, medium priority, high priority" 
        });
        return;
      }

      const task = await this.taskService.createTask(userId, title, label, parsedStartDate, parsedDueDate, assignedTo);

      // Schedule notifications for the new task
      try {
        const notificationScheduler = getGlobalNotificationScheduler();
        if (notificationScheduler) {
          // Check if this is a deadline task (same start and due date)
          const isDeadline = this.isSameDay(parsedStartDate, parsedDueDate);
          
          if (isDeadline) {
            // For deadline tasks, send immediate notification
            console.log(`📅 Sending immediate deadline notification for task ${task._id}`);
            
            // Get the user to send notification to
            const user = await User.findById(userId);
            if (user && user.phoneNumber) {
              // Send immediate deadline notification
              const whatsappService = new WhatsAppService();
              await whatsappService.sendTaskDeadlineNotification({
                task,
                user,
                isDeadline: true
              });
              console.log(`✅ Immediate deadline notification sent to ${user.phoneNumber}`);
            } else {
              console.log('⚠️ User has no phone number for WhatsApp notifications');
            }
          } else {
            // For regular tasks, schedule deadline notification
            console.log(`📅 Task ${task._id} will be checked for deadline notifications`);
          }
        }
      } catch (notificationError) {
        console.error('⚠️ Error scheduling notifications for new task:', notificationError);
        // Don't fail the task creation if notification scheduling fails
      }

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: this.formatTaskResponse(task),
      });
    } catch (error) {
      console.error("Error creating task:", error);
      
      // Handle specific assignment-related errors
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
          return;
        }
        
        if (error.message.includes("assignedTo")) {
          res.status(400).json({
            success: false,
            message: "Invalid assignment. Please check the assigned user email.",
          });
          return;
        }
      }
      
      res.status(500).json({
        success: false,
        message: `Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // Update a task
  UpdateTask: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const { id } = req.params;
      const { title, completed, label, startDate, dueDate, assignedTo } = req.body;

      if (label && !Object.values(TaskLabel).includes(label)) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid label. Must be one of: low priority, medium priority, high priority" 
        });
        return;
      }

      const updateData: any = {};
      
      if (title !== undefined) updateData.title = title;
      if (completed !== undefined) updateData.completed = completed;
      if (label !== undefined) updateData.label = label;

      // Parse start date if provided (beginning of day)
      if (startDate) {
        let parsedStartDate: Date;
        if (typeof startDate === 'string') {
          try {
            parsedStartDate = parseDateFromDDMMYYYY(startDate, false);
          } catch (error) {
            res.status(400).json({ 
              success: false, 
              message: "Invalid start date format. Use DD/MM/YYYY" 
            });
            return;
          }
        } else {
          parsedStartDate = new Date(startDate);
          parsedStartDate.setHours(0, 0, 0, 0);
        }

        if (isNaN(parsedStartDate.getTime())) {
          res.status(400).json({ 
            success: false, 
            message: "Invalid start date" 
          });
          return;
        }
        updateData.startDate = parsedStartDate;
      }

      // Parse due date if provided (end of day)
      if (dueDate) {
        let parsedDate: Date;
        if (typeof dueDate === 'string') {
          try {
            parsedDate = parseDateFromDDMMYYYY(dueDate, true);
          } catch (error) {
            res.status(400).json({ 
              success: false, 
              message: "Invalid due date format. Use DD/MM/YYYY" 
            });
            return;
          }
        } else {
          parsedDate = new Date(dueDate);
          parsedDate.setHours(23, 59, 59, 999);
        }

        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ 
            success: false, 
            message: "Invalid due date" 
          });
          return;
        }
        updateData.dueDate = parsedDate;
      }

      // Validate dates if both are provided (allow same day)
      if (updateData.startDate && updateData.dueDate) {
        if (updateData.startDate > updateData.dueDate) {
          res.status(400).json({ 
            success: false, 
            message: "Due date cannot be before start date" 
          });
          return;
        }
      }

      // Handle assignedTo field
      if (assignedTo !== undefined) {
        console.log('🔄 Processing assignedTo field:', { 
          taskId: id, 
          assignedTo, 
          assignedToLength: assignedTo?.length || 0 
        });
        updateData.assignedTo = assignedTo;
      }

      const todo = await this.taskService.updateTask(id, userId, updateData);
      if (!todo) {
        res.status(404).json({ success: false, message: "Task not found" });
        return;
      }
      
      console.log('✅ Task updated successfully:', { 
        taskId: todo._id, 
        assignedTo: todo.assignedTo,
        assignedToLength: todo.assignedTo?.length || 0 
      });
      
      const formattedTodo = this.formatTaskResponse(todo);
      res.status(200).json({ success: true, data: formattedTodo });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error updating task: ${error}`,
      });
    }
  };

  // Delete a task
  DeleteTask: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const { id } = req.params;
      await this.taskService.deleteTask(id, userId);
      res.status(204).json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error deleting task: ${error}`,
      });
    }
  };

  // Toggle task completion
  ToggleTaskCompletion: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ success: false, message: "Task ID is required" });
        return;
      }

      const task = await this.taskService.toggleTaskCompletion(id, userId);
      
      if (!task) {
        res.status(404).json({ success: false, message: "Task not found" });
        return;
      }

      const formattedTask = this.formatTaskResponse(task);
      res.status(200).json({ 
        success: true, 
        data: formattedTask,
        message: "Task toggled successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to toggle task",
      });
    }
  };
}
