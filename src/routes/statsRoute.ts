// src/routes/statsRoute.ts
import express from "express";
import statsController from "../controllers/statsController";

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Stats router is working" });
});

// Stats route
router.get("/", statsController.getTodoStats);

export default router; 