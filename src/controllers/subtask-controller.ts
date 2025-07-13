import { RequestHandler } from "express";
import SubtaskService from "../services/subtask-service";
import { getUserId } from "../utils/auth-types";

class SubtaskController {
  // Create a new subtask
  createSubtask: RequestHandler = async (req, res) => {
    console.log('🔥 Backend: createSubtask called with body:', req.body);
    console.log('🔥 Backend: taskId from params:', req.params.taskId);
    try {
      const { title, startDate, endDate } = req.body;
      const { taskId } = req.params;

      if (!title || typeof title !== "string" || title.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: "Title is required and must be a non-empty string"
        });
        return;
      }

      if (!taskId) {
        res.status(400).json({
          success: false,
          message: "Task ID is required"
        });
        return;
      }

      // Parse dates if provided
      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;

      if (startDate) {
        parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          res.status(400).json({
            success: false,
            message: "Invalid start date format"
          });
          return;
        }
      }

      if (endDate) {
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          res.status(400).json({
            success: false,
            message: "Invalid end date format"
          });
          return;
        }
      }

      // Validate date logic
      if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
        res.status(400).json({
          success: false,
          message: "Start date cannot be after end date"
        });
        return;
      }

      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const subtask = await SubtaskService.createSubtask(
        userId, 
        taskId, 
        title.trim(), 
        undefined, // description
        parsedStartDate,
        parsedEndDate
      );

      res.status(201).json({
        success: true,
        data: subtask,
        message: "Subtask created successfully"
      });
    } catch (error) {
      console.error("Error creating subtask:", error);
      res.status(error instanceof Error && error.message === "Task not found" ? 404 : 500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create subtask"
      });
    }
  };

  // Get all subtasks for a task
  getSubtasksByTaskId: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({
          success: false,
          message: "Task ID is required"
        });
        return;
      }

      const subtasks = await SubtaskService.getSubtasksByTaskId(userId, taskId);

      res.status(200).json({
        success: true,
        data: subtasks,
        message: "Subtasks retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting subtasks:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get subtasks"
      });
    }
  };

  // Get a specific subtask
  getSubtaskById: RequestHandler = async (req, res) => {
    try {
      const { subtaskId } = req.params;

      if (!subtaskId) {
        res.status(400).json({
          success: false,
          message: "Subtask ID is required"
        });
        return;
      }

      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const subtask = await SubtaskService.getSubtaskById(userId, subtaskId);

      res.status(200).json({
        success: true,
        data: subtask,
        message: "Subtask retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting subtask:", error);
      res.status(error instanceof Error && error.message === "Subtask not found" ? 404 : 400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get subtask"
      });
    }
  };

  // Update a subtask
  updateSubtask: RequestHandler = async (req, res) => {
    try {
      const { subtaskId } = req.params;
      const updateData = req.body;

      if (!subtaskId) {
        res.status(400).json({
          success: false,
          message: "Subtask ID is required"
        });
        return;
      }

      // Validate update data
      if (updateData.title !== undefined) {
        if (typeof updateData.title !== "string" || updateData.title.trim().length === 0) {
          res.status(400).json({
            success: false,
            message: "Title must be a non-empty string"
          });
          return;
        }
        updateData.title = updateData.title.trim();
      }

      if (updateData.completed !== undefined && typeof updateData.completed !== "boolean") {
        res.status(400).json({
          success: false,
          message: "Completed must be a boolean"
        });
        return;
      }

      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const subtask = await SubtaskService.updateSubtask(userId, subtaskId, updateData);

      res.status(200).json({
        success: true,
        data: subtask,
        message: "Subtask updated successfully"
      });
    } catch (error) {
      console.error("Error updating subtask:", error);
      res.status(error instanceof Error && error.message === "Subtask not found" ? 404 : 400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update subtask"
      });
    }
  };

  // Delete a subtask
  deleteSubtask: RequestHandler = async (req, res) => {
    try {
      const { subtaskId } = req.params;

      if (!subtaskId) {
        res.status(400).json({
          success: false,
          message: "Subtask ID is required"
        });
        return;
      }

      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const result = await SubtaskService.deleteSubtask(userId, subtaskId);

      res.status(200).json({
        success: true,
        data: result,
        message: "Subtask deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting subtask:", error);
      res.status(error instanceof Error && error.message === "Subtask not found" ? 404 : 400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete subtask"
      });
    }
  };

  // Toggle subtask completion
  toggleSubtask: RequestHandler = async (req, res) => {
    try {
      const { subtaskId } = req.params;

      if (!subtaskId) {
        res.status(400).json({
          success: false,
          message: "Subtask ID is required"
        });
        return;
      }

      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const subtask = await SubtaskService.toggleSubtask(userId, subtaskId);

      res.status(200).json({
        success: true,
        data: subtask,
        message: "Subtask toggled successfully"
      });
    } catch (error) {
      console.error("Error toggling subtask:", error);
      res.status(error instanceof Error && error.message === "Subtask not found" ? 404 : 400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to toggle subtask"
      });
    }
  };

  // Get subtask statistics for a task
  getSubtaskStats: RequestHandler = async (req, res) => {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({
          success: false,
          message: "Task ID is required"
        });
        return;
      }

      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const stats = await SubtaskService.getSubtaskStats(userId, taskId);

      res.status(200).json({
        success: true,
        data: stats,
        message: "Subtask statistics retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting subtask stats:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get subtask statistics"
      });
    }
  };
}

export default new SubtaskController();
