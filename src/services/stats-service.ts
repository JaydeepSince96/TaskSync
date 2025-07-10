// src/services/StatsService.ts
import { TaskLabel } from "../models/task-model";
import Task from "../models/task-model";

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

class StatsService {
  // Helper method to get week number
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Helper method to build date match condition
  private buildDateMatchCondition(options: DateFilterOptions = {}): any {
    const { period, startDate, endDate, year, month, week } = options;
    const now = new Date();
    let matchCondition: any = {};

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
    // If no period specified, return all tasks (no date filter)

    return matchCondition;
  }

  // Get task statistics by label with date filtering
  async getTaskStats(filterOptions: DateFilterOptions = {}): Promise<TaskStats[]> {
    const matchCondition = this.buildDateMatchCondition(filterOptions);
    
    const pipeline: any[] = [];
    
    // Add match stage only if there are conditions
    if (Object.keys(matchCondition).length > 0) {
      pipeline.push({ $match: matchCondition });
    }
    
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
  async getOverallStats(filterOptions: DateFilterOptions = {}): Promise<OverallStats> {
    const matchCondition = this.buildDateMatchCondition(filterOptions);
    
    const pipeline: any[] = [];
    
    // Add match stage only if there are conditions
    if (Object.keys(matchCondition).length > 0) {
      pipeline.push({ $match: matchCondition });
    }
    
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

    return stats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      overallCompletionRate: 0
    };
  }
}

export default new StatsService(); 