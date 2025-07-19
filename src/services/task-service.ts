// src/services/TodoService.ts
import { ITask, TaskLabel } from "../models/task-model";
import Task from "../models/task-model";
import { User } from "../models/user-model";
import SubtaskService from "./subtask-service";

interface TaskFilterOptions {
  searchId?: string;
  priority?: string;
  status?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  page?: number;
  limit?: number;
}

class TaskService {
  // Get all task for a specific user
  async getAllTask(userId: string): Promise<ITask[]> {
    return await Task.find({ userId })
      .populate('assignedTo', 'name email profilePicture')
      .sort({ dueDate: 1 });
  }

  // Get single task by ID for a specific user
  async getTaskById(id: string, userId: string): Promise<ITask | null> {
    try {
      return await Task.findOne({ _id: id, userId })
        .populate('assignedTo', 'name email profilePicture');
    } catch (error) {
      console.error('Error fetching task by ID:', error);
      throw new Error('Invalid task ID format');
    }
  }

  // Get filtered tasks for a specific user
  async getFilteredTasks(userId: string, filters: TaskFilterOptions): Promise<{
    tasks: ITask[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    const {
      searchId,
      priority,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = filters;

    // Build the query object - always include userId
    const query: any = { userId };

    // Search by ID (exact match or partial match)
    if (searchId && searchId.trim()) {
      const trimmedId = searchId.trim();
      try {
        // Try exact ObjectId match first
        if (trimmedId.length === 24) {
          query._id = trimmedId;
        } else {
          // For partial matches, convert ObjectId to string and use regex
          query.$expr = {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: trimmedId,
              options: "i"
            }
          };
        }
      } catch (error) {
        // If not a valid ObjectId, search in the string representation
        query.$expr = {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: trimmedId,
            options: "i"
          }
        };
      }
    }

    // Filter by priority
    if (priority && priority !== 'All' && priority !== 'All Priorities') {
      // Convert frontend priority format to backend format
      const priorityMap: { [key: string]: TaskLabel } = {
        'High Priority': TaskLabel.HIGH_PRIORITY,
        'Medium Priority': TaskLabel.MEDIUM_PRIORITY,
        'Low Priority': TaskLabel.LOW_PRIORITY,
        'High': TaskLabel.HIGH_PRIORITY,
        'Medium': TaskLabel.MEDIUM_PRIORITY,
        'Low': TaskLabel.LOW_PRIORITY,
        'high priority': TaskLabel.HIGH_PRIORITY,
        'medium priority': TaskLabel.MEDIUM_PRIORITY,
        'low priority': TaskLabel.LOW_PRIORITY,
        'high': TaskLabel.HIGH_PRIORITY,
        'medium': TaskLabel.MEDIUM_PRIORITY,
        'low': TaskLabel.LOW_PRIORITY
      };
      
      if (priorityMap[priority]) {
        query.label = priorityMap[priority];
      }
    }

    // Filter by status
    if (status && status !== 'All' && status !== 'All Statuses') {
      if (status === 'Completed' || status === 'completed' || status === 'Done' || status === 'done') {
        query.completed = true;
      } else if (status === 'Pending' || status === 'pending') {
        query.completed = false;
      } else if (status === 'Overdue' || status === 'overdue') {
        // Overdue tasks are not completed and have a due date in the past
        query.completed = false;
        query.dueDate = { $lt: new Date() };
      }
    }

    // Filter by date range (based on task start and due dates)
    if (startDate || endDate) {
      const dateQuery: any = {};
      
      if (startDate && endDate) {
        // If both dates are provided, find tasks that overlap with the date range
        // Task overlaps if: task.startDate <= endDate AND task.dueDate >= startDate
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd.setHours(23, 59, 59, 999);
        
        query.$and = [
          { startDate: { $lte: rangeEnd } },
          { dueDate: { $gte: rangeStart } }
        ];
      } else if (startDate) {
        // Only start date provided - find tasks that end after this date
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.dueDate = { $gte: start };
      } else if (endDate) {
        // Only end date provided - find tasks that start before this date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.startDate = { $lte: end };
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .populate('assignedTo', 'name email profilePicture')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      tasks,
      totalCount,
      totalPages,
      currentPage: page
    };
  }

  // Create a new task for a specific user
  async createTask(userId: string, title: string, label: TaskLabel, startDate: Date, dueDate: Date, assignedTo?: string[]): Promise<ITask> {
    const taskData: any = { userId, title, label, startDate, dueDate };
    
    // If assignedTo is provided, look up the users by email and get their ObjectIds
    if (assignedTo && assignedTo.length > 0) {
      try {
        const assignedUserIds = [];
        
        for (const email of assignedTo) {
          if (email && email.trim()) {
            // Find user by email
            const assignedUser = await User.findOne({ email: email.trim() });
            if (assignedUser) {
              assignedUserIds.push(assignedUser._id);
            } else {
              // If user not found, throw an error to ensure data integrity
              throw new Error(`User with email "${email.trim()}" not found`);
            }
          }
        }
        
        if (assignedUserIds.length > 0) {
          taskData.assignedTo = assignedUserIds;
        }
      } catch (error) {
        // Re-throw the error to be handled by the controller
        throw error;
      }
    }
    
    const task = new Task(taskData);
    return await (await task.save()).populate('assignedTo', 'name email profilePicture');
  }

  // Update a task for a specific user
  async updateTask(id: string, userId: string, updateData: { title?: string; completed?: boolean; label?: TaskLabel; startDate?: Date; dueDate?: Date; assignedTo?: string[] }): Promise<ITask | null> {
    const filteredUpdateData: any = {};
    
    if (updateData.title !== undefined) filteredUpdateData.title = updateData.title;
    if (updateData.completed !== undefined) filteredUpdateData.completed = updateData.completed;
    if (updateData.label !== undefined) filteredUpdateData.label = updateData.label;
    if (updateData.startDate !== undefined) filteredUpdateData.startDate = updateData.startDate;
    if (updateData.dueDate !== undefined) filteredUpdateData.dueDate = updateData.dueDate;
    
    // Handle assignedTo field - convert emails to ObjectIds
    if (updateData.assignedTo !== undefined) {
      if (updateData.assignedTo.length === 0) {
        // If empty array, clear assignments
        filteredUpdateData.assignedTo = [];
      } else {
        try {
          const assignedUserIds = [];
          
          for (const email of updateData.assignedTo) {
            if (email && email.trim()) {
              // Find user by email
              const assignedUser = await User.findOne({ email: email.trim() });
              if (assignedUser) {
                assignedUserIds.push(assignedUser._id);
              } else {
                // If user not found, throw an error to ensure data integrity
                throw new Error(`User with email "${email.trim()}" not found`);
              }
            }
          }
          
          filteredUpdateData.assignedTo = assignedUserIds;
        } catch (error) {
          // Re-throw the error to be handled by the controller
          throw error;
        }
      }
    }
    
    const updatedTask = await Task.findOneAndUpdate({ _id: id, userId }, filteredUpdateData, { new: true });
    
    if (updatedTask) {
      // Populate assignedTo with user details
      return await updatedTask.populate('assignedTo', 'name email profilePicture');
    }
    
    return null;
  }

  // Delete a task for a specific user
  async deleteTask(id: string, userId: string): Promise<void> {
    // First delete all subtasks associated with this task
    await SubtaskService.deleteSubtasksByTaskId(id, userId);
    // Then delete the main task
    await Task.findOneAndDelete({ _id: id, userId });
  }
}

export default new TaskService();