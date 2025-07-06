// src/controllers/TodoController.ts
import { Request, Response, RequestHandler } from "express";
import todoService from "../services/todoService";
import { TodoLabel } from "../models/todo";

class TodoController {
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
  private formatTodoResponse(todo: any) {
    return {
      ...todo.toObject(),
      dueDate: this.formatDate(new Date(todo.dueDate)),
      createdAt: this.formatDate(new Date(todo.createdAt)),
      updatedAt: this.formatDate(new Date(todo.updatedAt))
    };
  }

  // Get available label options
  getLabelOptions: RequestHandler = async (req, res) => {
    try {
      const labels = Object.values(TodoLabel).map(label => ({
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

  // Get all todos
  getAllTodos: RequestHandler = async (req, res) => {
    try {
      const todos = await todoService.getAllTodos();
      if (!todos) {
        res.status(404).json({ success: false, message: "No todos found" });
        return;
      }
      const formattedTodos = todos.map(todo => this.formatTodoResponse(todo));
      res.status(200).json({ success: true, data: formattedTodos });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error fetching todos: ${error}`,
      });
    }
  };

  // Create a new todo
  createTodo: RequestHandler = async (req, res) => {
    try {
      const { title, label, dueDate } = req.body;
      
      if (!dueDate) {
        res.status(400).json({ 
          success: false, 
          message: "Due date is required" 
        });
        return;
      }

      // Try different date formats
      let parsedDate: Date;
      if (typeof dueDate === 'string') {
        // Try parsing as ISO string
        parsedDate = new Date(dueDate);
        
        // If invalid, try parsing as simple date string (YYYY-MM-DD)
        if (isNaN(parsedDate.getTime())) {
          const [year, month, day] = dueDate.split('-');
          if (year && month && day) {
            parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        }
      } else {
        parsedDate = new Date(dueDate);
      }

      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid date format. Please use either:\n" +
                  "1. ISO format (e.g., 2024-03-25T10:00:00Z)\n" +
                  "2. Simple date format (e.g., 2024-03-25)" 
        });
        return;
      }

      if (!Object.values(TodoLabel).includes(label)) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid label. Must be one of: less important, important, very important" 
        });
        return;
      }

      const todo = await todoService.createTodo(title, label, parsedDate);
      const formattedTodo = this.formatTodoResponse(todo);
      res.status(201).json({ success: true, data: formattedTodo });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error creating todo: ${error}`,
      });
    }
  };

  // Update a todo
  updateTodo: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const { completed, label, dueDate } = req.body;

      if (label && !Object.values(TodoLabel).includes(label)) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid label. Must be one of: less important, important, very important" 
        });
        return;
      }

      let parsedDate: Date | undefined;
      if (dueDate) {
        if (typeof dueDate === 'string') {
          parsedDate = new Date(dueDate);
          if (isNaN(parsedDate.getTime())) {
            const [year, month, day] = dueDate.split('-');
            if (year && month && day) {
              parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          }
        } else {
          parsedDate = new Date(dueDate);
        }

        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ 
            success: false, 
            message: "Invalid date format. Please use either:\n" +
                    "1. ISO format (e.g., 2024-03-25T10:00:00Z)\n" +
                    "2. Simple date format (e.g., 2024-03-25)" 
          });
          return;
        }
      }

      const todo = await todoService.updateTodo(
        id,
        completed,
        label,
        parsedDate
      );
      if (!todo) {
        res.status(404).json({ success: false, message: "Todo not found" });
        return;
      }
      const formattedTodo = this.formatTodoResponse(todo);
      res.status(200).json({ success: true, data: formattedTodo });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error updating todo: ${error}`,
      });
    }
  };

  // Delete a todo
  deleteTodo: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      await todoService.deleteTodo(id);
      res.status(204).json({ success: true, message: "Todo deleted successfully" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error deleting todo: ${error}`,
      });
    }
  };
}

export default new TodoController();
