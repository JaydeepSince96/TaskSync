import Subtask from "../models/subtask-model";
import Task from "../models/task-model";
import mongoose from "mongoose";

interface CreateSubtaskPayload {
  title: string;
  taskId: string;
  startDate?: Date;
  endDate?: Date;
}

interface UpdateSubtaskPayload {
  title?: string;
  completed?: boolean;
  startDate?: Date;
  endDate?: Date;
}

class SubtaskService {
  // Create a new subtask for a task
  async createSubtask(payload: CreateSubtaskPayload) {
    // Verify that the main task exists
    const taskExists = await Task.findById(payload.taskId);
    if (!taskExists) {
      throw new Error("Task not found");
    }

    const subtask = new Subtask({
      title: payload.title,
      taskId: new mongoose.Types.ObjectId(payload.taskId),
      completed: false,
      startDate: payload.startDate,
      endDate: payload.endDate
    });

    return await subtask.save();
  }

  // Get all subtasks for a specific task
  async getSubtasksByTaskId(taskId: string) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error("Invalid task ID");
    }

    return await Subtask.find({ 
      taskId: new mongoose.Types.ObjectId(taskId) 
    }).sort({ createdAt: 1 });
  }

  // Get a specific subtask by ID
  async getSubtaskById(subtaskId: string) {
    if (!mongoose.Types.ObjectId.isValid(subtaskId)) {
      throw new Error("Invalid subtask ID");
    }

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      throw new Error("Subtask not found");
    }

    return subtask;
  }

  // Update a subtask
  async updateSubtask(subtaskId: string, payload: UpdateSubtaskPayload) {
    if (!mongoose.Types.ObjectId.isValid(subtaskId)) {
      throw new Error("Invalid subtask ID");
    }

    const subtask = await Subtask.findByIdAndUpdate(
      subtaskId,
      payload,
      { new: true, runValidators: true }
    );

    if (!subtask) {
      throw new Error("Subtask not found");
    }

    return subtask;
  }

  // Delete a subtask
  async deleteSubtask(subtaskId: string) {
    if (!mongoose.Types.ObjectId.isValid(subtaskId)) {
      throw new Error("Invalid subtask ID");
    }

    const subtask = await Subtask.findByIdAndDelete(subtaskId);
    if (!subtask) {
      throw new Error("Subtask not found");
    }

    return { message: "Subtask deleted successfully" };
  }

  // Toggle subtask completion status
  async toggleSubtask(subtaskId: string) {
    if (!mongoose.Types.ObjectId.isValid(subtaskId)) {
      throw new Error("Invalid subtask ID");
    }

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      throw new Error("Subtask not found");
    }

    subtask.completed = !subtask.completed;
    return await subtask.save();
  }

  // Get subtask statistics for a task
  async getSubtaskStats(taskId: string) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error("Invalid task ID");
    }

    const stats = await Subtask.aggregate([
      {
        $match: { taskId: new mongoose.Types.ObjectId(taskId) }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$completed", false] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          completed: 1,
          pending: 1,
          completionRate: {
            $multiply: [
              { $divide: ["$completed", { $max: ["$total", 1] }] },
              100
            ]
          }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      completionRate: 0
    };
  }

  // Delete all subtasks for a task (when main task is deleted)
  async deleteSubtasksByTaskId(taskId: string) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error("Invalid task ID");
    }

    return await Subtask.deleteMany({ 
      taskId: new mongoose.Types.ObjectId(taskId) 
    });
  }
}

export default new SubtaskService();
