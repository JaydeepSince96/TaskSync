// src/routes/todoRoutes.ts
import express from "express";
import { TaskController } from "../controllers/task-controller";
import { TaskService } from "../services/task-service";
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
const taskController = new TaskController(taskService);

const taskRouter = express.Router();

// Public routes (no authentication required)
taskRouter.get("/labels", taskController.GetLabelOptions);

// Protected routes (authentication required)
taskRouter.use(authenticateToken); // Apply authentication to all routes below

taskRouter.get("/filtered", paginationValidation, handleValidationErrors, taskController.GetFilteredTasks);

// Stats routes - MUST come before /:id route to avoid conflicts
taskRouter.use("/stats", statsRouter);

taskRouter.get("/:id", mongoIdValidation, handleValidationErrors, taskController.GetTaskById);
taskRouter.get("/", taskController.GetAllTask);
taskRouter.post("/", createTaskValidation, handleValidationErrors, taskController.CreateNewTask);
taskRouter.put("/:id", updateTaskValidation, handleValidationErrors, taskController.UpdateTask);
taskRouter.delete("/:id", mongoIdValidation, handleValidationErrors, taskController.DeleteTask);

export { taskRouter };  