// src/services/TodoService.ts
import { ITask, TaskLabel } from "../models/task-model";
import Task from "../models/task-model";
import { User } from "../models/user-model";
import { SubtaskService } from "./subtask-service";
import { Types } from "mongoose";

interface TaskFilterOptions {
  searchId?: string;
  priority?: string;
  status?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  page?: number;
  limit?: number;
}

export class TaskService {
  private subtaskService: SubtaskService;
  constructor() {
    this.subtaskService = new SubtaskService();
  }
  // Get all task for a specific user
  async getAllTask(userId: string): Promise<ITask[]> {
    console.log('🔄 Service: Getting all tasks for user:', { userId });
    
    const tasks = await Task.find({ userId })
      .populate('assignedTo', 'name email profilePicture')
      .sort({ dueDate: 1 });
    
    console.log('✅ Service: Tasks fetched:', { 
      totalTasks: tasks.length,
      tasksWithAssignments: tasks.filter(t => t.assignedTo && t.assignedTo.length > 0).length,
      assignmentsDetails: tasks.map(t => ({
        taskId: t._id,
        title: t.title,
        assignedTo: t.assignedTo,
        assignedToLength: Array.isArray(t.assignedTo) ? t.assignedTo.length : 0
      }))
    });
    
    return tasks;
  }

  // Get tasks assigned to a specific user
  async getAssignedTasks(userId: string): Promise<ITask[]> {
    console.log('🔄 Service: Getting assigned tasks for user:', { userId });
    
    const tasks = await Task.find({ assignedTo: userId })
      .populate('assignedTo', 'name email profilePicture')
      .populate('userId', 'name email profilePicture')
      .sort({ dueDate: 1 });
    
    console.log('✅ Service: Assigned tasks fetched:', { 
      totalAssignedTasks: tasks.length,
      assignedTasksDetails: tasks.map(t => ({
        taskId: t._id,
        title: t.title,
        createdBy: t.userId,
        assignedTo: t.assignedTo,
        assignedToLength: Array.isArray(t.assignedTo) ? t.assignedTo.length : 0
      }))
    });
    
    return tasks;
  }

  // Get all tasks (both created and assigned) for a specific user
  async getAllUserTasks(userId: string): Promise<{ created: ITask[], assigned: ITask[] }> {
    console.log('🔄 Service: Getting all user tasks (created and assigned):', { userId });
    
    const [createdTasks, assignedTasks] = await Promise.all([
      this.getAllTask(userId),
      this.getAssignedTasks(userId)
    ]);
    
    console.log('✅ Service: All user tasks fetched:', { 
      createdTasksCount: createdTasks.length,
      assignedTasksCount: assignedTasks.length,
      totalTasks: createdTasks.length + assignedTasks.length
    });
    
    return {
      created: createdTasks,
      assigned: assignedTasks
    };
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
  async createTask(userId: string, title: string, label: TaskLabel, startDate: Date, dueDate: Date, description?: string, assignedTo?: string[]): Promise<ITask> {
    // Validate required fields
    if (!title || !title.trim()) {
      throw new Error('Task title is required');
    }

    if (!startDate || !dueDate) {
      throw new Error('Start date and due date are required');
    }

    if (startDate > dueDate) {
      throw new Error('Start date cannot be after due date');
    }

    // Handle assignedTo field - convert emails to ObjectIds
    let assignedUserIds: Types.ObjectId[] = [];
    if (assignedTo && assignedTo.length > 0) {
      try {
        for (const email of assignedTo) {
          if (email && email.trim()) {
            // Find user by email
            const assignedUser = await User.findOne({ email: email.trim() });
            if (assignedUser) {
              assignedUserIds.push(assignedUser._id as Types.ObjectId);
            } else {
              // If user not found, throw an error to ensure data integrity
              throw new Error(`User with email "${email.trim()}" not found`);
            }
          }
        }
      } catch (error) {
        // Re-throw the error to be handled by the controller
        throw error;
      }
    }

    const task = new Task({
      title: title.trim(),
      description: description?.trim(), // Add description field
      label,
      startDate,
      dueDate,
      userId,
      assignedTo: assignedUserIds.length > 0 ? assignedUserIds : undefined,
    });

    const savedTask = await task.save();
    
    // Populate assignedTo with user details
    const populatedTask = await Task.findById(savedTask._id).populate('assignedTo', 'name email profilePicture');
    if (!populatedTask) {
      throw new Error('Failed to create task');
    }

    // Send email notifications to assigned users
    if (assignedUserIds.length > 0) {
      try {
        console.log('🔄 Service: Attempting to send email notifications for task creation...');
        
        // Import and initialize email service with error handling
        let EmailService;
        try {
          EmailService = require('./email-service').EmailService;
        } catch (importError) {
          console.error('❌ Error importing EmailService:', importError);
          console.log('ℹ️ Service: Skipping email notifications due to import error');
          return populatedTask;
        }
        
        const emailService = new EmailService();
        
        // Check if email service is properly initialized
        if (!emailService || typeof emailService.sendTaskAssignmentNotification !== 'function') {
          console.log('⚠️ Service: Email service not properly initialized, skipping notifications');
          return populatedTask;
        }
        
        // Get the user who created the task
        const taskCreator = await User.findById(userId);
        if (!taskCreator) {
          console.log('⚠️ Service: Task creator not found, skipping email notifications');
          return populatedTask;
        }
        
        console.log('🔄 Service: Task creator found:', { 
          creatorId: taskCreator._id, 
          creatorName: taskCreator.name,
          creatorEmail: taskCreator.email 
        });
        
        console.log(`🔄 Service: Sending notifications to ${assignedUserIds.length} assigned users`);
        
        for (const assignedUserId of assignedUserIds) {
          try {
            console.log(`🔄 Service: Processing email notification for user ID: ${assignedUserId}`);
            const assignedUser = await User.findById(assignedUserId);
            if (assignedUser && assignedUser.email) {
              console.log(`🔄 Service: Found assigned user:`, { 
                userId: assignedUser._id, 
                userName: assignedUser.name,
                userEmail: assignedUser.email 
              });
              
              const notificationResult = await emailService.sendTaskAssignmentNotification({
                task: populatedTask,
                assignedUser,
                assignedBy: taskCreator
              });
              
              if (notificationResult) {
                console.log(`✅ Task assignment notification sent to ${assignedUser.email}`);
              } else {
                console.log(`❌ Failed to send notification to ${assignedUser.email}`);
              }
            } else {
              console.log(`❌ Service: User not found for ID: ${assignedUserId}`);
            }
          } catch (userError) {
            console.error(`❌ Error processing email notification for user ${assignedUserId}:`, userError);
            // Continue with other users even if one fails
          }
        }
      } catch (error) {
        console.error('❌ Error sending task assignment notifications:', error);
        console.log('ℹ️ Service: Task creation will continue despite email notification failure');
        // Don't throw error - task creation should still succeed even if notifications fail
      }
    } else {
      console.log('ℹ️ Service: No assigned users, skipping email notifications');
    }

    return populatedTask;
  }

  // Update a task for a specific user
  async updateTask(id: string, userId: string, updateData: { title?: string; description?: string; completed?: boolean; label?: TaskLabel; startDate?: Date; dueDate?: Date; assignedTo?: string[] }): Promise<ITask | null> {
    const filteredUpdateData: any = {};
    
    if (updateData.title !== undefined) filteredUpdateData.title = updateData.title;
    if (updateData.description !== undefined) filteredUpdateData.description = updateData.description;
    if (updateData.completed !== undefined) filteredUpdateData.completed = updateData.completed;
    if (updateData.label !== undefined) filteredUpdateData.label = updateData.label;
    if (updateData.startDate !== undefined) filteredUpdateData.startDate = updateData.startDate;
    if (updateData.dueDate !== undefined) filteredUpdateData.dueDate = updateData.dueDate;
    
    // Handle assignedTo field - convert emails to ObjectIds
    if (updateData.assignedTo !== undefined) {
      console.log('🔄 Service: Processing assignedTo field:', { 
        updateDataAssignedTo: updateData.assignedTo,
        updateDataAssignedToLength: updateData.assignedTo?.length || 0 
      });
      
      if (updateData.assignedTo.length === 0) {
        // If empty array, clear assignments
        filteredUpdateData.assignedTo = [];
        console.log('🔄 Service: Clearing all assignments');
      } else {
        try {
          const assignedUserIds: Types.ObjectId[] = [];
          
          for (const email of updateData.assignedTo) {
            if (email && email.trim()) {
              // Find user by email
              const assignedUser = await User.findOne({ email: email.trim() });
              if (assignedUser) {
                assignedUserIds.push(assignedUser._id as Types.ObjectId);
                console.log('🔄 Service: Found user for assignment:', { email: email.trim(), userId: assignedUser._id });
              } else {
                // If user not found, throw an error to ensure data integrity
                console.log('❌ Service: User not found for assignment:', { email: email.trim() });
                throw new Error(`User with email "${email.trim()}" not found`);
              }
            }
          }
          
          filteredUpdateData.assignedTo = assignedUserIds;
          console.log('🔄 Service: Final assignedUserIds:', { assignedUserIds, count: assignedUserIds.length });
        } catch (error) {
          // Re-throw the error to be handled by the controller
          throw error;
        }
      }
    }
    
    // Get the original task to compare assignments BEFORE updating
    const originalTask = await Task.findById(id).populate('assignedTo', 'name email profilePicture');
    
    const updatedTask = await Task.findOneAndUpdate({ _id: id, userId }, filteredUpdateData, { new: true });
    
    if (updatedTask) {
      // Populate assignedTo with user details
      const populatedTask = await updatedTask.populate('assignedTo', 'name email profilePicture');
      
      console.log('✅ Service: Task updated and populated:', { 
        taskId: populatedTask._id,
        assignedTo: populatedTask.assignedTo,
        assignedToLength: populatedTask.assignedTo?.length || 0,
        assignedToDetails: Array.isArray(populatedTask.assignedTo) 
          ? populatedTask.assignedTo.map((u: any) => ({ name: u.name, email: u.email }))
          : []
      });
      
      // Send email notifications to newly assigned users
      if (updateData.assignedTo && updateData.assignedTo.length > 0) {
        try {
          console.log('🔄 Service: Attempting to send email notifications...');
          
          // Import and initialize email service with error handling
          let EmailService;
          try {
            EmailService = require('./email-service').EmailService;
          } catch (importError) {
            console.error('❌ Error importing EmailService:', importError);
            console.log('ℹ️ Service: Skipping email notifications due to import error');
            return populatedTask;
          }
          
          const emailService = new EmailService();
          
          // Check if email service is properly initialized
          if (!emailService || typeof emailService.sendTaskAssignmentNotification !== 'function') {
            console.log('⚠️ Service: Email service not properly initialized, skipping notifications');
            return populatedTask;
          }
          
          // Get the user who updated the task
          const taskUpdater = await User.findById(userId);
          if (!taskUpdater) {
            console.log('⚠️ Service: Task updater not found, skipping email notifications');
            return populatedTask;
          }
          
          console.log('🔄 Service: Task updater found:', { 
            updaterId: taskUpdater._id, 
            updaterName: taskUpdater.name,
            updaterEmail: taskUpdater.email 
          });
          
          if (originalTask && populatedTask) {
            const originalAssignedEmails = Array.isArray(originalTask.assignedTo) 
              ? originalTask.assignedTo.map((user: any) => user.email) 
              : [];
            const newAssignedEmails = updateData.assignedTo || [];
            
            // Find newly assigned users
            const newlyAssignedEmails = newAssignedEmails.filter(email => !originalAssignedEmails.includes(email));
            
            console.log('🔄 Service: Email notification analysis:', {
              originalAssignedEmails,
              newAssignedEmails,
              newlyAssignedEmails,
              originalTaskId: originalTask._id,
              populatedTaskId: populatedTask._id
            });
            
            if (newlyAssignedEmails.length === 0) {
              console.log('ℹ️ Service: No new assignments found, skipping email notifications');
            } else {
              console.log(`🔄 Service: Sending notifications to ${newlyAssignedEmails.length} newly assigned users`);
              
              for (const email of newlyAssignedEmails) {
                try {
                  console.log(`🔄 Service: Processing email notification for: ${email}`);
                  const assignedUser = await User.findOne({ email });
                  if (assignedUser && assignedUser.email) {
                    console.log(`🔄 Service: Found assigned user:`, { 
                      userId: assignedUser._id, 
                      userName: assignedUser.name,
                      userEmail: assignedUser.email 
                    });
                    
                    const notificationResult = await emailService.sendTaskAssignmentNotification({
                      task: populatedTask,
                      assignedUser,
                      assignedBy: taskUpdater
                    });
                    
                    if (notificationResult) {
                      console.log(`✅ Task assignment notification sent to ${assignedUser.email}`);
                    } else {
                      console.log(`❌ Failed to send notification to ${assignedUser.email}`);
                    }
                  } else {
                    console.log(`❌ Service: User not found for email: ${email}`);
                  }
                } catch (userError) {
                  console.error(`❌ Error processing email notification for user ${email}:`, userError);
                  // Continue with other users even if one fails
                }
              }
            }
          } else {
            console.log('❌ Service: Missing originalTask or populatedTask for email notifications');
          }
        } catch (error) {
          console.error('❌ Error sending task assignment notifications:', error);
          console.log('ℹ️ Service: Task update will continue despite email notification failure');
          // Don't throw error - task update should still succeed even if notifications fail
        }
      } else {
        console.log('ℹ️ Service: No assignedTo data provided, skipping email notifications');
      }
      
      return populatedTask;
    }
    
    return null;
  }

  // Delete a task for a specific user
  async deleteTask(id: string, userId: string): Promise<void> {
    // First delete all subtasks associated with this task
    await this.subtaskService.deleteSubtasksByTaskId(userId, id);
    // Then delete the main task
    await Task.findOneAndDelete({ _id: id, userId });
  }

  // Toggle task completion status for a specific user
  async toggleTaskCompletion(id: string, userId: string): Promise<ITask | null> {
    try {
      console.log(`🎯 Backend: toggleTaskCompletion called for task ${id}, user ${userId}`);
      
      // Find the current task
      const currentTask = await Task.findOne({ _id: id, userId });
      
      if (!currentTask) {
        console.log(`🎯 Backend: Task ${id} not found`);
        return null;
      }

      console.log(`🎯 Backend: Current task completion status: ${currentTask.completed}`);

      // If trying to mark task as complete, check if all subtasks are completed
      if (!currentTask.completed) {
        console.log(`🎯 Backend: Attempting to mark task as complete, checking subtasks...`);
        const subtaskStats = await this.subtaskService.getSubtaskStats(userId, id);
        
        console.log(`🎯 Backend: Subtask stats - total: ${subtaskStats.total}, completed: ${subtaskStats.completed}`);
        
        // If there are subtasks and not all are completed, prevent completion
        if (subtaskStats.total > 0 && subtaskStats.completed < subtaskStats.total) {
          throw new Error(`Cannot mark task as done! You must complete all ${subtaskStats.total} subtasks first. Currently ${subtaskStats.completed}/${subtaskStats.total} completed.`);
        }
      } else {
        console.log(`🎯 Backend: Marking completed task as pending (incomplete)`);
      }

      // Toggle the completed status
      const newCompletedStatus = !currentTask.completed;
      console.log(`🎯 Backend: New completion status will be: ${newCompletedStatus}`);
      
      // Update the task with the new completion status
      const updatedTask = await Task.findOneAndUpdate(
        { _id: id, userId },
        { completed: newCompletedStatus },
        { new: true }
      );

      if (updatedTask) {
        console.log(`🎯 Backend: Task updated successfully, new status: ${updatedTask.completed}`);
        // Populate assignedTo with user details
        return await updatedTask.populate('assignedTo', 'name email profilePicture');
      }
      
      console.log(`🎯 Backend: Failed to update task`);
      return null;
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error; // Re-throw the error to preserve the specific error message
    }
  }
}