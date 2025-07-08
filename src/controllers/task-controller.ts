// src/controllers/TodoController.ts
import { Request, Response, RequestHandler } from "express";
import TaskService from "../services/task-service";
import { TaskLabel } from "../models/task-model";

class TaskController {
  // Helper function to format date
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year}, ${hours}:${minutes}`;
  }

  // Helper function to format todo response
  private formatTaskResponse(todo: any) {
    return {
      ...todo.toObject(),
      startDate: this.formatDate(new Date(todo.startDate)),
      dueDate: this.formatDate(new Date(todo.dueDate)),
      createdAt: this.formatDate(new Date(todo.createdAt)),
      updatedAt: this.formatDate(new Date(todo.updatedAt))
    };
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
      const todos = await TaskService.getAllTask();
      if (!todos) {
        res.status(404).json({ success: false, message: "No todos found" });
        return;
      }
      const formattedTodos = todos.map(todo => this.formatTaskResponse(todo));
      res.status(200).json({ success: true, data: formattedTodos });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error fetching todos: ${error}`,
      });
    }
  };

  // Get filtered tasks
  GetFilteredTasks: RequestHandler = async (req, res) => {
    try {
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

      const result = await TaskService.getFilteredTasks(filters);
      
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
      const { title, label, startDate, dueDate } = req.body;
      
      if (!dueDate || !startDate) {
        res.status(400).json({ 
          success: false, 
          message: "Both start date and due date are required" 
        });
        return;
      }

      // Parse start date
      let parsedStartDate: Date;
      if (typeof startDate === 'string') {
        // Try parsing as dd/mm/yyyy format first
        if (startDate.includes('/')) {
          const [day, month, year] = startDate.split('/');
          if (day && month && year) {
            parsedStartDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            parsedStartDate = new Date(NaN); // Invalid date
          }
        } else {
          // Try parsing as ISO string
          parsedStartDate = new Date(startDate);
          
          // If invalid, try parsing as simple date string (YYYY-MM-DD)
          if (isNaN(parsedStartDate.getTime())) {
            const [year, month, day] = startDate.split('-');
            if (year && month && day) {
              parsedStartDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          }
        }
      } else {
        parsedStartDate = new Date(startDate);
      }

      if (isNaN(parsedStartDate.getTime())) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid start date format. Please use dd/mm/yyyy format (e.g., 25/03/2024)" 
        });
        return;
      }

      // Parse due date
      let parsedDueDate: Date;
      if (typeof dueDate === 'string') {
        // Try parsing as dd/mm/yyyy format first
        if (dueDate.includes('/')) {
          const [day, month, year] = dueDate.split('/');
          if (day && month && year) {
            parsedDueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            parsedDueDate = new Date(NaN); // Invalid date
          }
        } else {
          // Try parsing as ISO string
          parsedDueDate = new Date(dueDate);
          
          // If invalid, try parsing as simple date string (YYYY-MM-DD)
          if (isNaN(parsedDueDate.getTime())) {
            const [year, month, day] = dueDate.split('-');
            if (year && month && day) {
              parsedDueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          }
        }
      } else {
        parsedDueDate = new Date(dueDate);
      }

      if (isNaN(parsedDueDate.getTime())) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid due date format. Please use dd/mm/yyyy format (e.g., 25/03/2024)" 
        });
        return;
      }

      // Validate that start date is before due date
      if (parsedStartDate >= parsedDueDate) {
        res.status(400).json({ 
          success: false, 
          message: "Start date must be before due date" 
        });
        return;
      }

      if (!Object.values(TaskLabel).includes(label)) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid label. Must be one of: low priority, medium priority, high priority, priority" 
        });
        return;
      }

      const task = await TaskService.createTask(title, label, parsedStartDate, parsedDueDate);
      const formattedTodo = this.formatTaskResponse(task);
      res.status(201).json({ success: true, data: formattedTodo });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error creating todo: ${error}`,
      });
    }
  };

  // Update a task
  UpdateTask: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, completed, label, startDate, dueDate } = req.body;

      if (label && !Object.values(TaskLabel).includes(label)) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid label. Must be one of: High Priority, Medium Priority, Low Priority" 
        });
        return;
      }

      const updateData: any = {};
      
      if (title !== undefined) updateData.title = title;
      if (completed !== undefined) updateData.completed = completed;
      if (label !== undefined) updateData.label = label;

      // Parse start date if provided
      if (startDate) {
        let parsedStartDate: Date;
        if (typeof startDate === 'string') {
          // Try parsing as dd/mm/yyyy format first
          if (startDate.includes('/')) {
            const [day, month, year] = startDate.split('/');
            if (day && month && year) {
              parsedStartDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              parsedStartDate = new Date(NaN); // Invalid date
            }
          } else {
            // Try parsing as ISO string
            parsedStartDate = new Date(startDate);
            
            // If invalid, try parsing as simple date string (YYYY-MM-DD)
            if (isNaN(parsedStartDate.getTime())) {
              const [year, month, day] = startDate.split('-');
              if (year && month && day) {
                parsedStartDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
            }
          }
        } else {
          parsedStartDate = new Date(startDate);
        }

        if (isNaN(parsedStartDate.getTime())) {
          res.status(400).json({ 
            success: false, 
            message: "Invalid start date format. Please use dd/mm/yyyy format (e.g., 25/03/2024)" 
          });
          return;
        }
        updateData.startDate = parsedStartDate;
      }

      // Parse due date if provided
      if (dueDate) {
        let parsedDate: Date;
        if (typeof dueDate === 'string') {
          // Try parsing as dd/mm/yyyy format first
          if (dueDate.includes('/')) {
            const [day, month, year] = dueDate.split('/');
            if (day && month && year) {
              parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              parsedDate = new Date(NaN); // Invalid date
            }
          } else {
            // Try parsing as ISO string
            parsedDate = new Date(dueDate);
            
            // If invalid, try parsing as simple date string (YYYY-MM-DD)
            if (isNaN(parsedDate.getTime())) {
              const [year, month, day] = dueDate.split('-');
              if (year && month && day) {
                parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
            }
          }
        } else {
          parsedDate = new Date(dueDate);
        }

        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ 
            success: false, 
            message: "Invalid due date format. Please use dd/mm/yyyy format (e.g., 25/03/2024)" 
          });
          return;
        }
        updateData.dueDate = parsedDate;
      }

      const todo = await TaskService.updateTask(id, updateData);
      if (!todo) {
        res.status(404).json({ success: false, message: "Todo not found" });
        return;
      }
      const formattedTodo = this.formatTaskResponse(todo);
      res.status(200).json({ success: true, data: formattedTodo });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error updating todo: ${error}`,
      });
    }
  };

  // Delete a task
  DeleteTask: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      await TaskService.deleteTask(id);
      res.status(204).json({ success: true, message: "Todo deleted successfully" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error deleting todo: ${error}`,
      });
    }
  };
}

export default new TaskController();
