// src/services/TodoService.ts
import { ITask, TaskLabel } from "../models/task-model";
import Task from "../models/task-model";

class TaskService {
  // Get all task
  async getAllTask(): Promise<ITask[]> {
    return await Task.find({}).sort({ dueDate: 1 });
  }

  // Create a new task
  async createTask(title: string, label: TaskLabel, startDate: Date, dueDate: Date): Promise<ITask> {
    const task = new Task({ title, label, startDate, dueDate });
    return await task.save();
  }

  // Update a task
  async updateTask(id: string, completed: boolean, label: TaskLabel, dueDate?: Date): Promise<ITask | null> {
    const updateData: any = { completed, label };
    if (dueDate) updateData.dueDate = dueDate;
    return await Task.findByIdAndUpdate(id, updateData, { new: true });
  }

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    await Task.findByIdAndDelete(id);
  }
}

export default new TaskService();