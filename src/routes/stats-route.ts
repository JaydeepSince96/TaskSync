// src/routes/statsRoute.ts
import express from "express";
import { StatsController } from "../controllers/stats-controller";
import { StatsService } from "../services/stats-service";
import { SubtaskService } from "../services/subtask-service";

const subtaskService = new SubtaskService();
const statsService = new StatsService(subtaskService);
const statsController = new StatsController(statsService);

const statsRouter = express.Router();

// Stats route
statsRouter.get("/", statsController.getTaskStats);

// Subtask stats route for productivity analytics
statsRouter.get("/subtasks", statsController.getSubtaskStats);

// Historical trends route for dashboard analytics
statsRouter.get("/trends", statsController.getHistoricalTrends);

export { statsRouter }; 