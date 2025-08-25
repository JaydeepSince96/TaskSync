// src/services/subtask-service.ts
import Subtask, { ISubtask } from "../models/subtask-model";
import Task from "../models/task-model";

interface SubtaskStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export class SubtaskService {
  // Helper method to automatically manage task completion based on subtasks
  private async autoManageTaskCompletion(userId: string, taskId: string): Promise<void> {
    try {
      const task = await Task.findOne({
        _id: taskId,
        $or: [
          { userId: userId }, // Tasks created by the user
          { assignedTo: userId } // Tasks assigned to the user
        ]
      });
      if (!task) return;

      const subtasks = await Subtask.find({ taskId });
      const total = subtasks.length;
      const completed = subtasks.filter((st: ISubtask) => st.completed).length;

      // If there are subtasks
      if (total > 0) {
        const shouldBeCompleted = completed === total;
        const shouldBeIncomplete = completed < total;

        // Update task completion status if needed
        if (shouldBeCompleted && !task.completed) {
          task.completed = true;
          await task.save();
          console.log(`🎯 Auto-completed task ${taskId} due to all subtasks completed`);
        } else if (shouldBeIncomplete && task.completed) {
          task.completed = false;
          await task.save();
          console.log(`🎯 Auto-marked task ${taskId} as incomplete due to incomplete subtasks`);
        }
      }
    } catch (error) {
      console.error('Error in auto task completion management:', error);
    }
  }

  // Create a new subtask for a specific user
  async createSubtask(
    userId: string, 
    taskId: string, 
    title: string, 
    description?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ISubtask> {
    // Verify the task exists and user has access (either created or assigned)
    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { userId: userId }, // Tasks created by the user
        { assignedTo: userId } // Tasks assigned to the user
      ]
    });
    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const subtask = new Subtask({
      userId,
      taskId,
      title,
      description,
      completed: false,
      startDate,
      endDate
    });

    const savedSubtask = await subtask.save();

    // If the task was completed and we're adding a new subtask, mark task as pending
    if (task.completed) {
      task.completed = false;
      await task.save();
      console.log(`🎯 Task ${taskId} marked as pending due to new subtask addition`);
    }

    return savedSubtask;
  }

  // Get all subtasks for a specific task and user
  async getSubtasksByTaskId(userId: string, taskId: string): Promise<ISubtask[]> {
    // Verify the task exists and user has access (either created or assigned)
    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { userId: userId }, // Tasks created by the user
        { assignedTo: userId } // Tasks assigned to the user
      ]
    });
    if (!task) {
      throw new Error('Task not found or access denied');
    }

    return await Subtask.find({ taskId }).sort({ createdAt: 1 });
  }

  // Get a specific subtask by ID for a user
  async getSubtaskById(userId: string, subtaskId: string): Promise<ISubtask | null> {
    const subtask = await Subtask.findOne({ _id: subtaskId });
    if (!subtask) {
      return null;
    }

    // Check if user has access to this subtask
    const task = await Task.findOne({
      _id: subtask.taskId,
      $or: [
        { userId: userId }, // Tasks created by the user
        { assignedTo: userId } // Tasks assigned to the user
      ]
    });

    if (!task) {
      return null; // User doesn't have access
    }

    return subtask;
  }

  // Update a subtask for a specific user
  async updateSubtask(userId: string, subtaskId: string, updateData: {
    title?: string;
    description?: string;
    completed?: boolean;
    completedAt?: Date;
  }): Promise<ISubtask | null> {
    // First check if user has access to this subtask
    const subtask = await Subtask.findOne({ _id: subtaskId });
    if (!subtask) {
      return null;
    }

    const task = await Task.findOne({
      _id: subtask.taskId,
      $or: [
        { userId: userId }, // Tasks created by the user
        { assignedTo: userId } // Tasks assigned to the user
      ]
    });

    if (!task) {
      throw new Error("Access denied: You don't have permission to modify this subtask");
    }

    // If completion status is being changed, update the completedAt field
    const finalUpdateData: any = { ...updateData };
    if (updateData.completed !== undefined) {
      if (updateData.completed && !subtask.completed) {
        // Marking as completed
        finalUpdateData.completedAt = new Date();
      } else if (!updateData.completed && subtask.completed) {
        // Marking as incomplete
        finalUpdateData.completedAt = undefined;
      }
    }

    const updatedSubtask = await Subtask.findOneAndUpdate(
      { _id: subtaskId },
      finalUpdateData,
      { new: true }
    );

    if (updatedSubtask && updateData.completed !== undefined) {
      // Auto-manage task completion when subtask completion status changes
      await this.autoManageTaskCompletion(userId, updatedSubtask.taskId.toString());
    }

    return updatedSubtask;
  }

  // Toggle subtask completion status for a specific user
  async toggleSubtask(userId: string, subtaskId: string): Promise<ISubtask | null> {
    // First find the subtask
    const subtask = await Subtask.findOne({ _id: subtaskId });
    if (!subtask) {
      return null;
    }

    // Check if user has access to this subtask (either created the task or is assigned to it)
    const task = await Task.findOne({
      _id: subtask.taskId,
      $or: [
        { userId: userId }, // Tasks created by the user
        { assignedTo: userId } // Tasks assigned to the user
      ]
    });

    if (!task) {
      throw new Error("Access denied: You don't have permission to modify this subtask");
    }

    subtask.completed = !subtask.completed;
    
    // Update completedAt field when toggling completion
    if (subtask.completed) {
      subtask.completedAt = new Date();
    } else {
      subtask.completedAt = undefined;
    }
    
    const updatedSubtask = await subtask.save();

    // Auto-manage task completion when subtask is toggled
    await this.autoManageTaskCompletion(userId, subtask.taskId.toString());

    return updatedSubtask;
  }

  // Delete a subtask for a specific user
  async deleteSubtask(userId: string, subtaskId: string): Promise<boolean> {
    // First check if user has access to this subtask
    const subtask = await Subtask.findOne({ _id: subtaskId });
    if (!subtask) {
      return false;
    }

    const task = await Task.findOne({
      _id: subtask.taskId,
      $or: [
        { userId: userId }, // Tasks created by the user
        { assignedTo: userId } // Tasks assigned to the user
      ]
    });

    if (!task) {
      throw new Error("Access denied: You don't have permission to delete this subtask");
    }

    const result = await Subtask.deleteOne({ _id: subtaskId });
    return result.deletedCount > 0;
  }

  // Get subtask statistics for a specific task and user
  async getSubtaskStats(userId: string, taskId: string): Promise<SubtaskStats> {
    // Verify the task exists and user has access (either created or assigned)
    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { userId: userId }, // Tasks created by the user
        { assignedTo: userId } // Tasks assigned to the user
      ]
    });
    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const subtasks = await Subtask.find({ taskId });
    const total = subtasks.length;
    const completed = subtasks.filter((subtask: ISubtask) => subtask.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      pending,
      completionRate: Math.round(completionRate * 100) / 100 // Round to 2 decimal places
    };
  }

  // Get all subtasks for a specific user
  async getAllSubtasksForUser(userId: string): Promise<ISubtask[]> {
    return await Subtask.find({ userId }).sort({ createdAt: -1 });
  }

  // Get subtasks for multiple tasks
  async getSubtasksForTasks(userId: string, taskIds: string[]): Promise<ISubtask[]> {
    return await Subtask.find({ 
      userId, 
      taskId: { $in: taskIds } 
    }).sort({ createdAt: 1 });
  }

  // Bulk update subtasks
  async bulkUpdateSubtasks(userId: string, subtaskIds: string[], updateData: {
    completed?: boolean;
    description?: string;
  }): Promise<number> {
    const result = await Subtask.updateMany(
      { _id: { $in: subtaskIds }, userId },
      updateData
    );
    return result.modifiedCount;
  }

  // Delete all subtasks for a specific task
  async deleteSubtasksByTaskId(userId: string, taskId: string): Promise<number> {
    // First check if user has access to this task
    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { userId: userId }, // Tasks created by the user
        { assignedTo: userId } // Tasks assigned to the user
      ]
    });

    if (!task) {
      throw new Error("Access denied: You don't have permission to delete subtasks for this task");
    }

    const result = await Subtask.deleteMany({ taskId });
    return result.deletedCount;
  }

  // Get user's overall subtask completion rate
  async getUserSubtaskCompletionRate(userId: string): Promise<number> {
    const subtasks = await Subtask.find({ userId });
    const total = subtasks.length;
    const completed = subtasks.filter((subtask: ISubtask) => subtask.completed).length;
    
    return total > 0 ? (completed / total) * 100 : 0;
  }

  // Get recent subtasks for a user (last 10)
  async getRecentSubtasks(userId: string, limit: number = 10): Promise<ISubtask[]> {
    return await Subtask.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Search subtasks by title for a specific user
  async searchSubtasks(userId: string, searchTerm: string): Promise<ISubtask[]> {
    return await Subtask.find({
      userId,
      title: { $regex: searchTerm, $options: 'i' }
    }).sort({ createdAt: -1 });
  }

  // Get subtasks by completion status for a specific user
  async getSubtasksByStatus(userId: string, completed: boolean): Promise<ISubtask[]> {
    return await Subtask.find({ userId, completed }).sort({ createdAt: -1 });
  }

  // Count subtasks for a specific user
  async countSubtasks(userId: string, filters?: { taskId?: string; completed?: boolean }): Promise<number> {
    const query: any = { userId };
    
    if (filters) {
      if (filters.taskId) query.taskId = filters.taskId;
      if (filters.completed !== undefined) query.completed = filters.completed;
    }
    
    return await Subtask.countDocuments(query);
  }

  // Get subtask statistics by date range for productivity analytics
  async getSubtaskStatsByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{ completed: number; total: number }> {
    console.log(`🔍 getSubtaskStatsByDateRange - userId: ${userId}, startDate: ${startDate}, endDate: ${endDate}`);
    
    // Query for subtasks that were either created or updated during the date range
    const baseQuery = {
      userId,
      $or: [
        // Subtasks created during the date range
        {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Subtasks updated during the date range (for completion status changes)
        {
          updatedAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      ]
    };

    // For completed subtasks, we need to be more specific:
    // Count subtasks that were marked as completed during the date range
    const completedQuery = {
      userId,
      completed: true,
      $or: [
        // Subtasks that were created as completed during the date range
        {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Subtasks that were marked as completed during the date range (using completedAt field)
        {
          completedAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      ]
    };

    const [totalSubtasks, completedSubtasks] = await Promise.all([
      Subtask.countDocuments(baseQuery),
      Subtask.countDocuments(completedQuery)
    ]);

    console.log(`🔍 getSubtaskStatsByDateRange - totalSubtasks: ${totalSubtasks}, completedSubtasks: ${completedSubtasks}`);

    return {
      completed: completedSubtasks,
      total: totalSubtasks
    };
  }

  // Get subtasks with pagination for a specific user
  async getSubtasksWithPagination(userId: string, options: {
    page?: number;
    limit?: number;
    taskId?: string;
    completed?: boolean;
  } = {}): Promise<{
    subtasks: ISubtask[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { page = 1, limit = 10, taskId, completed } = options;
    
    const query: any = { userId };
    if (taskId) query.taskId = taskId;
    if (completed !== undefined) query.completed = completed;
    
    const skip = (page - 1) * limit;
    
    const [subtasks, totalCount] = await Promise.all([
      Subtask.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Subtask.countDocuments(query)
    ]);
    
    return {
      subtasks,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  }
}
