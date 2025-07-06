// src/services/StatsService.ts
import { TaskLabel } from "../models/task-model";
import Task from "../models/task-model";

interface TodoStats {
  label: string;
  total: number;
  completed: number;
  notCompleted: number;
  completionRate: number;
  overdue: number;
}

class StatsService {
  // Get todo statistics by label
  async getTaskStats(): Promise<TodoStats[]> {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: "$label",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] }
          },
          notCompleted: {
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
          notCompleted: 1,
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
          notCompleted: 0,
          overdue: 0,
          completionRate: 0
        });
      }
    });

    // Sort by label for consistent ordering
    return stats.sort((a, b) => a.label.localeCompare(b.label));
  }

  // Get overall statistics
  async getOverallStats() {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: null,
          totalTask: { $sum: 1 },
          completedTask: {
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] }
          },
          notCompletedTask: {
            $sum: { $cond: [{ $eq: ["$completed", false] }, 1, 0] }
          },
          overdueTask: {
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
          totalTask: 1,
          completedTask: 1,
          notCompletedTask: 1,
          overdueTask: 1,
          completionRate: {
            $multiply: [
              { $divide: ["$completedTask", { $max: ["$totalTask", 1] }] },
              100
            ]
          }
        }
      }
    ]);

    return stats[0] || {
      totalTask: 0,
      completedTask: 0,
      notCompletedTask: 0,
      overdueTask: 0,
      completionRate: 0
    };
  }
}

export default new StatsService(); 