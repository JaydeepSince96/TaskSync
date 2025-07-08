// src/services/TodoService.ts
import { ITask, TaskLabel } from "../models/task-model";
import Task from "../models/task-model";
import SubtaskService from "./subtask-service";

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
  async updateTask(id: string, updateData: { title?: string; completed?: boolean; label?: TaskLabel; startDate?: Date; dueDate?: Date }): Promise<ITask | null> {
    const filteredUpdateData: any = {};
    
    if (updateData.title !== undefined) filteredUpdateData.title = updateData.title;
    if (updateData.completed !== undefined) filteredUpdateData.completed = updateData.completed;
    if (updateData.label !== undefined) filteredUpdateData.label = updateData.label;
    if (updateData.startDate !== undefined) filteredUpdateData.startDate = updateData.startDate;
    if (updateData.dueDate !== undefined) filteredUpdateData.dueDate = updateData.dueDate;
    
    return await Task.findByIdAndUpdate(id, filteredUpdateData, { new: true });
  }

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    // First delete all subtasks associated with this task
    await SubtaskService.deleteSubtasksByTaskId(id);
    // Then delete the main task
    await Task.findByIdAndDelete(id);
  }
}

export default new TaskService();