// src/controllers/StatsController.ts
import { Request, Response, RequestHandler } from "express";
import statsService from "../services/statsService";

class StatsController {
  // Get todo statistics
  getTodoStats: RequestHandler = async (req, res) => {
    console.log("Stats endpoint hit");
    try {
      console.log("Fetching stats from service");
      const [labelStats, overallStats] = await Promise.all([
        statsService.getTodoStats(),
        statsService.getOverallStats()
      ]);
      
      console.log("Stats fetched successfully");
      res.status(200).json({
        success: true,
        data: {
          labelStats,
          overallStats
        }
      });
    } catch (error) {
      console.error("Error in getTodoStats:", error);
      res.status(500).json({
        success: false,
        message: `Error fetching todo statistics: ${error}`,
      });
    }
  };
}

export default new StatsController(); 