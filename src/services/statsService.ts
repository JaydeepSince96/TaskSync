// src/services/StatsService.ts
import { TodoLabel } from "../models/todo";
import Todo from "../models/todo";

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
  async getTodoStats(): Promise<TodoStats[]> {
    const stats = await Todo.aggregate([
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
    const allLabels = Object.values(TodoLabel);
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
    const stats = await Todo.aggregate([
      {
        $group: {
          _id: null,
          totalTodos: { $sum: 1 },
          completedTodos: {
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] }
          },
          notCompletedTodos: {
            $sum: { $cond: [{ $eq: ["$completed", false] }, 1, 0] }
          },
          overdueTodos: {
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
          totalTodos: 1,
          completedTodos: 1,
          notCompletedTodos: 1,
          overdueTodos: 1,
          completionRate: {
            $multiply: [
              { $divide: ["$completedTodos", { $max: ["$totalTodos", 1] }] },
              100
            ]
          }
        }
      }
    ]);

    return stats[0] || {
      totalTodos: 0,
      completedTodos: 0,
      notCompletedTodos: 0,
      overdueTodos: 0,
      completionRate: 0
    };
  }
}

export default new StatsService(); 