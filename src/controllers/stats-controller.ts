import { Request, Response, RequestHandler } from "express";
import { StatsService } from "../services/stats-service";
import { getUserId } from "../utils/auth-types";

export class StatsController {
  constructor(private statsService: StatsService) {}

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
        this.statsService.getTaskStats(userId, {
          period: period as string,
          startDate: startDate as string,
          endDate: endDate as string,
          year: year ? parseInt(year as string) : undefined,
          month: month ? parseInt(month as string) : undefined,
          week: week ? parseInt(week as string) : undefined,
        }),
        this.statsService.getOverallStats(userId, {
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

  // Get subtask statistics by date range for productivity analytics
  getSubtaskStats: RequestHandler = async (req, res) => {
    console.log("Subtask stats endpoint hit");
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      // Extract date parameters from query string
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "startDate and endDate are required"
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid date format"
        });
        return;
      }

      console.log("Fetching subtask stats for user:", userId, "from", start, "to", end);
      
      const subtaskStats = await this.statsService.getSubtaskStatsByDateRange(userId, start, end);
      
      console.log("Subtask stats fetched successfully:", subtaskStats);
      res.status(200).json({
        success: true,
        data: subtaskStats
      });
    } catch (error) {
      console.error("Error in getSubtaskStats:", error);
      res.status(500).json({
        success: false,
        message: `Error fetching subtask statistics: ${error}`,
      });
    }
  };

  // Get historical trend data for dashboard analytics
  getHistoricalTrends: RequestHandler = async (req, res) => {
    console.log("Historical trends endpoint hit");
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      // Extract period parameter from query string
      const { period } = req.query;
      const validPeriods = ['week', 'month', 'year'];
      const trendPeriod = validPeriods.includes(period as string) ? period as 'week' | 'month' | 'year' : 'week';

      console.log("Fetching historical trends for user:", userId, "period:", trendPeriod);
      
      const trends = await this.statsService.getHistoricalTrends(userId, trendPeriod);
      
      console.log("Historical trends fetched successfully:", trends);
      res.status(200).json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error("Error in getHistoricalTrends:", error);
      res.status(500).json({
        success: false,
        message: `Error fetching historical trends: ${error}`,
      });
    }
  };
} 