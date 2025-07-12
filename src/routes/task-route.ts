// src/routes/todoRoutes.ts
import express from "express";
import TaskController from "../controllers/task-controller";
import statsRoute from "./stats-route";
import { authenticateToken } from "../middleware/auth-middleware";
import {
  createTaskValidation,
  updateTaskValidation,
  mongoIdValidation,
  paginationValidation,
  handleValidationErrors
} from "../middleware/validation-middleware";

const router = express.Router();

// Public routes (no authentication required)
router.get("/labels", TaskController.GetLabelOptions);

// Protected routes (authentication required)
router.use(authenticateToken); // Apply authentication to all routes below

router.get("/filtered", paginationValidation, handleValidationErrors, TaskController.GetFilteredTasks);

// Stats routes - MUST come before /:id route to avoid conflicts
router.use("/stats", statsRoute);

router.get("/:id", mongoIdValidation, handleValidationErrors, TaskController.GetTaskById);
router.get("/", TaskController.GetAllTask);
router.post("/", createTaskValidation, handleValidationErrors, TaskController.CreateNewTask);
router.put("/:id", updateTaskValidation, handleValidationErrors, TaskController.UpdateTask);
router.delete("/:id", mongoIdValidation, handleValidationErrors, TaskController.DeleteTask);

export default router;  