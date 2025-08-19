// src/routes/todoRoutes.ts
import express from "express";
import { TaskController } from "../controllers/task-controller";
import { TaskService } from "../services/task-service";
import { SubtaskService } from "../services/subtask-service";
import { statsRouter } from "./stats-route";
import { authenticateToken } from "../middleware/auth-middleware";
import {
  createTaskValidation,
  updateTaskValidation,
  mongoIdValidation,
  paginationValidation,
  handleValidationErrors
} from "../middleware/validation-middleware";

const taskService = new TaskService();
const subtaskService = new SubtaskService();
const taskController = new TaskController(taskService, subtaskService);

const taskRouter = express.Router();

// Public routes (no authentication required)
taskRouter.get("/labels", taskController.GetLabelOptions);

// Public share routes (no authentication required)
taskRouter.get("/public/share/:taskId", taskController.GetPublicTask);
taskRouter.get("/public/share/:taskId/subtask-stats", taskController.GetPublicSubtaskStats);

// Protected routes (authentication required)
taskRouter.use(authenticateToken); // Apply authentication to all routes below

taskRouter.get("/filtered", paginationValidation, handleValidationErrors, taskController.GetFilteredTasks);

// Stats routes - MUST come before /:id route to avoid conflicts
taskRouter.use("/stats", statsRouter);

// IMPORTANT: Place the "/" route BEFORE "/:id" route to avoid conflicts
taskRouter.get("/", taskController.GetAllTask);
taskRouter.get("/assigned", taskController.GetAssignedTasks);
taskRouter.get("/all", taskController.GetAllUserTasks);
taskRouter.get("/:id", mongoIdValidation, handleValidationErrors, taskController.GetTaskById);
taskRouter.post("/", createTaskValidation, handleValidationErrors, taskController.CreateNewTask);
taskRouter.put("/:id", updateTaskValidation, handleValidationErrors, taskController.UpdateTask);
taskRouter.delete("/:id", mongoIdValidation, handleValidationErrors, taskController.DeleteTask);
taskRouter.patch("/:id/toggle", mongoIdValidation, handleValidationErrors, taskController.ToggleTaskCompletion);

export { taskRouter };  