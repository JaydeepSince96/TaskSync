import { Router } from "express";
import SubtaskController from "../controllers/subtask-controller";

const router = Router();

// Subtask routes for a specific task
router.post("/tasks/:taskId/subtasks", SubtaskController.createSubtask);
router.get("/tasks/:taskId/subtasks", SubtaskController.getSubtasksByTaskId);
router.get("/tasks/:taskId/subtasks/stats", SubtaskController.getSubtaskStats);

// Individual subtask routes
router.get("/subtasks/:subtaskId", SubtaskController.getSubtaskById);
router.put("/subtasks/:subtaskId", SubtaskController.updateSubtask);
router.patch("/subtasks/:subtaskId/toggle", SubtaskController.toggleSubtask);
router.delete("/subtasks/:subtaskId", SubtaskController.deleteSubtask);

export default router;
