// src/routes/statsRoute.ts
import express from "express";
import { StatsController } from "../controllers/stats-controller";
import { StatsService } from "../services/stats-service";

const statsService = new StatsService();
const statsController = new StatsController(statsService);

const statsRouter = express.Router();

// Test route
statsRouter.get("/test", (req, res) => {
  res.json({ message: "Stats router is working" });
});

// Stats route
statsRouter.get("/", statsController.getTaskStats);

export { statsRouter }; 