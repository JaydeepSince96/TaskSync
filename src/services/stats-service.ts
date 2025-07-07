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

class StatsService {
  // Get task statistics by label
  async getTaskStats(): Promise<TaskStats[]> {
    const stats = await Task.aggregate([
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
    ]);

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

  // Get overall statistics
  async getOverallStats(): Promise<OverallStats> {
    const stats = await Task.aggregate([
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
    ]);

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