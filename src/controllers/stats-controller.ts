// src/controllers/StatsController.ts
import { Request, Response, RequestHandler } from "express";
import statsService from "../services/stats-service";

class StatsController {
  // Get todo statistics with optional date filtering
  getTaskStats: RequestHandler = async (req, res) => {
    console.log("Stats endpoint hit");
    try {
      console.log("Fetching stats from service");
      
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
        statsService.getTaskStats({
          period: period as string,
          startDate: startDate as string,
          endDate: endDate as string,
          year: year ? parseInt(year as string) : undefined,
          month: month ? parseInt(month as string) : undefined,
          week: week ? parseInt(week as string) : undefined,
        }),
        statsService.getOverallStats({
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