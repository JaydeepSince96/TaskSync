// src/controllers/StatsController.ts
import { Request, Response, RequestHandler } from "express";
import statsService from "../services/stats-service";
import { getUserId } from "../utils/auth-types";

class StatsController {
  // Get todo statistics with optional date filtering
  getTaskStats: RequestHandler = async (req, res) => {
    console.log("Stats endpoint hit");
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      console.log("Fetching stats from service for user:", userId);
      
      // Extract filter parameters from query string
      const { 
        period, 
        startDate, 
        endDate, 
        year, 
        month, 
        week 
      } = req.query;

      console.log("Filter parameters:", { period, startDate, endDate, year, month, week });

      const [labelStats, overallStats] = await Promise.all([
        statsService.getTaskStats(userId, {
          period: period as string,
          startDate: startDate as string,
          endDate: endDate as string,
          year: year ? parseInt(year as string) : undefined,
          month: month ? parseInt(month as string) : undefined,
          week: week ? parseInt(week as string) : undefined,
        }),
        statsService.getOverallStats(userId, {
          period: period as string,
          startDate: startDate as string,
          endDate: endDate as string,
          year: year ? parseInt(year as string) : undefined,
          month: month ? parseInt(month as string) : undefined,
          week: week ? parseInt(week as string) : undefined,
        })
      ]);
      
      console.log("Stats fetched successfully");
      res.status(200).json({
        success: true,
        data: {
          labelStats,
          overallStats,
          filterApplied: {
            period,
            startDate,
            endDate,
            year,
            month,
            week
          }
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