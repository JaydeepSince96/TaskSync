// src/services/subtask-service.ts
import { ISubtask } from "../models/subtask-model";
import Subtask from "../models/subtask-model";
import Task from "../models/task-model";

interface SubtaskStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

class SubtaskService {
  // Create a new subtask for a specific user
  async createSubtask(userId: string, taskId: string, title: string, description?: string): Promise<ISubtask> {
    // Verify the task exists and belongs to the user
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new Error('Task not found or does not belong to user');
    }

    const subtask = new Subtask({
      userId,
      taskId,
      title,
      description,
      completed: false
    });

    return await subtask.save();
  }

  // Get all subtasks for a specific task and user
  async getSubtasksByTaskId(userId: string, taskId: string): Promise<ISubtask[]> {
    // Verify the task exists and belongs to the user
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new Error('Task not found or does not belong to user');
    }

    return await Subtask.find({ userId, taskId }).sort({ createdAt: 1 });
  }

  // Get a specific subtask by ID for a user
  async getSubtaskById(userId: string, subtaskId: string): Promise<ISubtask | null> {
    return await Subtask.findOne({ _id: subtaskId, userId });
  }

  // Update a subtask for a specific user
  async updateSubtask(userId: string, subtaskId: string, updateData: {
    title?: string;
    description?: string;
    completed?: boolean;
  }): Promise<ISubtask | null> {
    return await Subtask.findOneAndUpdate(
      { _id: subtaskId, userId },
      updateData,
      { new: true }
    );
  }

  // Toggle subtask completion status for a specific user
  async toggleSubtask(userId: string, subtaskId: string): Promise<ISubtask | null> {
    const subtask = await Subtask.findOne({ _id: subtaskId, userId });
    if (!subtask) {
      return null;
    }

    subtask.completed = !subtask.completed;
    return await subtask.save();
  }

  // Delete a subtask for a specific user
  async deleteSubtask(userId: string, subtaskId: string): Promise<boolean> {
    const result = await Subtask.deleteOne({ _id: subtaskId, userId });
    return result.deletedCount > 0;
  }

  // Get subtask statistics for a specific task and user
  async getSubtaskStats(userId: string, taskId: string): Promise<SubtaskStats> {
    // Verify the task exists and belongs to the user
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new Error('Task not found or does not belong to user');
    }

    const subtasks = await Subtask.find({ userId, taskId });
    const total = subtasks.length;
    const completed = subtasks.filter(subtask => subtask.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      pending,
      completionRate: Math.round(completionRate * 100) / 100 // Round to 2 decimal places
    };
  }

  // Get all subtasks for a specific user across all tasks
  async getAllSubtasksForUser(userId: string): Promise<ISubtask[]> {
    return await Subtask.find({ userId }).sort({ createdAt: -1 });
  }

  // Get subtasks for multiple tasks for a specific user
  async getSubtasksForTasks(userId: string, taskIds: string[]): Promise<ISubtask[]> {
    return await Subtask.find({ 
      userId,
      taskId: { $in: taskIds } 
    }).sort({ createdAt: 1 });
  }

  // Bulk update subtasks for a specific user
  async bulkUpdateSubtasks(userId: string, subtaskIds: string[], updateData: {
    completed?: boolean;
    description?: string;
  }): Promise<number> {
    const result = await Subtask.updateMany(
      { 
        _id: { $in: subtaskIds },
        userId 
      },
      updateData
    );
    return result.modifiedCount;
  }

  // Delete all subtasks for a specific task and user
  async deleteSubtasksByTaskId(userId: string, taskId: string): Promise<number> {
    const result = await Subtask.deleteMany({ userId, taskId });
    return result.deletedCount;
  }

  // Get subtask completion rate for a user across all tasks
  async getUserSubtaskCompletionRate(userId: string): Promise<number> {
    const subtasks = await Subtask.find({ userId });
    const total = subtasks.length;
    
    if (total === 0) return 0;
    
    const completed = subtasks.filter(subtask => subtask.completed).length;
    return Math.round((completed / total) * 100 * 100) / 100; // Round to 2 decimal places
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

export default new SubtaskService();
