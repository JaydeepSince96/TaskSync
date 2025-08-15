// src/services/StatsService.ts
import { TaskLabel } from "../models/task-model";
import Task, { ITask } from "../models/task-model";
import { Types } from "mongoose";
import { SubtaskService } from "./subtask-service";

interface TaskStats {
  label: string;
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  overdue: number;
}

interface OverallStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  overallCompletionRate: number;
}

interface DateFilterOptions {
  period?: string; // 'week' | 'month' | 'year' | 'custom'
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  week?: number;
}

export class StatsService {
  constructor(private subtaskService: SubtaskService) {}

  // Helper method to get week number
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Helper method to build date match condition
  private buildDateMatchCondition(userId: string, options: DateFilterOptions = {}): any {
    const { period, startDate, endDate, year, month, week } = options;
    const now = new Date();
    let matchCondition: any = {
      $or: [
        { userId: new Types.ObjectId(userId) }, // Tasks created by the user
        { assignedTo: new Types.ObjectId(userId) } // Tasks assigned to the user
      ]
    };

    console.log('🔍 buildDateMatchCondition - userId:', userId, 'type:', typeof userId);
    console.log('🔍 buildDateMatchCondition - ObjectId userId:', new Types.ObjectId(userId));
    console.log('🔍 buildDateMatchCondition - initial matchCondition:', matchCondition);

    if (period === 'custom' && startDate && endDate) {
      // Custom date range
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (period === 'week') {
      // Specific week of a year
      const targetYear = year || now.getFullYear();
      const targetWeek = week || this.getWeekNumber(now);
      
      // Calculate the start date of the specified week
      const startOfYear = new Date(targetYear, 0, 1);
      const daysToAdd = (targetWeek - 1) * 7 - startOfYear.getDay();
      const startOfWeek = new Date(startOfYear);
      startOfWeek.setDate(startOfYear.getDate() + daysToAdd);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      matchCondition.createdAt = {
        $gte: startOfWeek,
        $lte: endOfWeek
      };
    } else if (period === 'month') {
      // Current month or specific month
      const targetYear = year || now.getFullYear();
      const targetMonth = month !== undefined ? month - 1 : now.getMonth(); // month is 0-indexed
      
      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
      
      matchCondition.createdAt = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    } else if (period === 'year') {
      // Current year or specific year
      const targetYear = year || now.getFullYear();
      
      const startOfYear = new Date(targetYear, 0, 1);
      const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);
      
      matchCondition.createdAt = {
        $gte: startOfYear,
        $lte: endOfYear
      };
    }
    // If no period specified, return all tasks for this user (with user filter)

    return matchCondition;
  }

  // Get task statistics by label with date filtering
  async getTaskStats(userId: string, filterOptions: DateFilterOptions = {}): Promise<TaskStats[]> {
    console.log('🔍 getTaskStats - userId:', userId, 'type:', typeof userId);
    console.log('🔍 getTaskStats - filterOptions:', filterOptions);
    
    const matchCondition = this.buildDateMatchCondition(userId, filterOptions);
    console.log('🔍 getTaskStats - matchCondition:', JSON.stringify(matchCondition, null, 2));
    
    const pipeline: any[] = [
      { $match: matchCondition } // Always include match with userId
    ];
    
    pipeline.push(
      {
        $group: {
          _id: "$label",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$completed", false] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$completed", false] },
                    { $lt: ["$dueDate", new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          label: "$_id",
          total: 1,
          completed: 1,
          pending: 1,
          overdue: 1,
          completionRate: {
            $multiply: [
              { $divide: ["$completed", { $max: ["$total", 1] }] },
              100
            ]
          }
        }
      }
    );

    const stats = await Task.aggregate(pipeline);
    console.log('🔍 getTaskStats - pipeline result:', JSON.stringify(stats, null, 2));
    console.log('🔍 getTaskStats - raw task count for user:', await Task.countDocuments({ userId: new Types.ObjectId(userId) }));

    // Add labels with zero todos
    const allLabels = Object.values(TaskLabel);
    const existingLabels = stats.map(stat => stat.label);
    
    allLabels.forEach(label => {
      if (!existingLabels.includes(label)) {
        stats.push({
          label,
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
          completionRate: 0
        });
      }
    });

    // Sort by label for consistent ordering
    return stats.sort((a, b) => a.label.localeCompare(b.label));
  }

  // Get overall statistics with date filtering
  async getOverallStats(userId: string, filterOptions: DateFilterOptions = {}): Promise<OverallStats> {
    console.log('🔍 getOverallStats - userId:', userId, 'type:', typeof userId);
    
    const matchCondition = this.buildDateMatchCondition(userId, filterOptions);
    console.log('🔍 getOverallStats - matchCondition:', JSON.stringify(matchCondition, null, 2));
    
    const pipeline: any[] = [
      { $match: matchCondition } // Always include match with userId
    ];
    
    pipeline.push(
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ["$completed", false] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$completed", false] },
                    { $lt: ["$dueDate", new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalTasks: 1,
          completedTasks: 1,
          pendingTasks: 1,
          overdueTasks: 1,
          overallCompletionRate: {
            $multiply: [
              { $divide: ["$completedTasks", { $max: ["$totalTasks", 1] }] },
              100
            ]
          }
        }
      }
    );

    const stats = await Task.aggregate(pipeline);
    console.log('🔍 getOverallStats - pipeline result:', JSON.stringify(stats, null, 2));
    console.log('🔍 getOverallStats - raw task count for user:', await Task.countDocuments({ userId: new Types.ObjectId(userId) }));

    return stats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      overallCompletionRate: 0
    };
  }

  // Get subtask statistics by date range for productivity analytics
  async getSubtaskStatsByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{ completed: number; total: number }> {
    return await this.subtaskService.getSubtaskStatsByDateRange(userId, startDate, endDate);
  }

  // Get historical trend data for dashboard analytics
  async getHistoricalTrends(userId: string, period: 'week' | 'month' | 'year' = 'week'): Promise<{
    totalTasks: { current: number; previous: number; change: number };
    completedTasks: { current: number; previous: number; change: number };
    pendingTasks: { current: number; previous: number; change: number };
    overdueTasks: { current: number; previous: number; change: number };
  }> {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    if (period === 'week') {
      // Current week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - daysToMonday);
      currentStart.setHours(0, 0, 0, 0);
      
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + 6);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous week
      previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 7);
      previousEnd = new Date(currentEnd);
      previousEnd.setDate(currentEnd.getDate() - 7);
    } else if (period === 'month') {
      // Current month
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Previous month
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
      // Current year
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      // Previous year
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    }

    // Get stats for current and previous periods
    const [currentStats, previousStats] = await Promise.all([
      this.getOverallStats(userId, {
        period: 'custom',
        startDate: currentStart.toISOString(),
        endDate: currentEnd.toISOString()
      }),
      this.getOverallStats(userId, {
        period: 'custom',
        startDate: previousStart.toISOString(),
        endDate: previousEnd.toISOString()
      })
    ]);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalTasks: {
        current: currentStats.totalTasks,
        previous: previousStats.totalTasks,
        change: calculateChange(currentStats.totalTasks, previousStats.totalTasks)
      },
      completedTasks: {
        current: currentStats.completedTasks,
        previous: previousStats.completedTasks,
        change: calculateChange(currentStats.completedTasks, previousStats.completedTasks)
      },
      pendingTasks: {
        current: currentStats.pendingTasks,
        previous: previousStats.pendingTasks,
        change: calculateChange(currentStats.pendingTasks, previousStats.pendingTasks)
      },
      overdueTasks: {
        current: currentStats.overdueTasks,
        previous: previousStats.overdueTasks,
        change: calculateChange(currentStats.overdueTasks, previousStats.overdueTasks)
      }
    };
  }
} 