import { Router } from "express";
import { SubtaskController } from "../controllers/subtask-controller";
import { SubtaskService } from "../services/subtask-service";
import { authenticateToken } from "../middleware/auth-middleware";

const subtaskService = new SubtaskService();
const subtaskController = new SubtaskController(subtaskService);

const subtaskRouter = Router();
subtaskRouter.use(authenticateToken);
subtaskRouter.post("/tasks/:taskId/subtasks", subtaskController.createSubtask);
subtaskRouter.get("/tasks/:taskId/subtasks", subtaskController.getSubtasksByTaskId);
subtaskRouter.get("/tasks/:taskId/subtasks/stats", subtaskController.getSubtaskStats);
subtaskRouter.get("/:subtaskId", subtaskController.getSubtaskById);
subtaskRouter.put("/:subtaskId", subtaskController.updateSubtask);
subtaskRouter.patch("/:subtaskId/toggle", subtaskController.toggleSubtask);
subtaskRouter.delete("/:subtaskId", subtaskController.deleteSubtask);

export { subtaskRouter };
