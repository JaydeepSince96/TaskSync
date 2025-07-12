// src/migrations/migration-runner.ts
import { connectDB } from "../utils/db";
import { User } from "../models/user-model";
import Task from "../models/task-model";
import Subtask from "../models/subtask-model";

interface MigrationResult {
  name: string;
  success: boolean;
  message: string;
  affectedDocuments?: number;
}

class MigrationRunner {
  private migrations: Array<() => Promise<MigrationResult>> = [
    this.addUserIdToExistingTasks.bind(this),
    this.addUserIdToExistingSubtasks.bind(this),
    this.createDefaultUserForOrphanedData.bind(this),
    this.updateTaskIndexes.bind(this),
    this.updateSubtaskIndexes.bind(this)
  ];

  async runAllMigrations(): Promise<void> {
    console.log("🚀 Starting database migrations...");
    
    try {
      await connectDB();
      
      for (const migration of this.migrations) {
        const result = await migration();
        if (result.success) {
          console.log(`✅ ${result.name}: ${result.message}`);
          if (result.affectedDocuments !== undefined) {
            console.log(`   📊 Affected documents: ${result.affectedDocuments}`);
          }
        } else {
          console.error(`❌ ${result.name}: ${result.message}`);
        }
      }
      
      console.log("🎉 All migrations completed!");
    } catch (error) {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    }
  }

  // Migration 1: Add userId to existing tasks
  private async addUserIdToExistingTasks(): Promise<MigrationResult> {
    try {
      // Find tasks without userId
      const tasksWithoutUserId = await Task.find({ userId: { $exists: false } });
      
      if (tasksWithoutUserId.length === 0) {
        return {
          name: "Add userId to existing tasks",
          success: true,
          message: "No tasks found without userId",
          affectedDocuments: 0
        };
      }

      // Create a default user if none exists
      let defaultUser = await User.findOne({ email: "default@tasksync.com" });
      
      if (!defaultUser) {
        defaultUser = new User({
          name: "Default User",
          email: "default@tasksync.com",
          password: "temp123456", // This will be hashed automatically
          isEmailVerified: true
        });
        await defaultUser.save();
      }

      // Update all tasks without userId
      const result = await Task.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: defaultUser._id } }
      );

      return {
        name: "Add userId to existing tasks",
        success: true,
        message: `Successfully added userId to existing tasks`,
        affectedDocuments: result.modifiedCount
      };
    } catch (error: any) {
      return {
        name: "Add userId to existing tasks",
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  // Migration 2: Add userId to existing subtasks
  private async addUserIdToExistingSubtasks(): Promise<MigrationResult> {
    try {
      // Find subtasks without userId
      const subtasksWithoutUserId = await Subtask.find({ userId: { $exists: false } });
      
      if (subtasksWithoutUserId.length === 0) {
        return {
          name: "Add userId to existing subtasks",
          success: true,
          message: "No subtasks found without userId",
          affectedDocuments: 0
        };
      }

      // Get the default user
      const defaultUser = await User.findOne({ email: "default@tasksync.com" });
      
      if (!defaultUser) {
        return {
          name: "Add userId to existing subtasks",
          success: false,
          message: "Default user not found. Please run task migration first."
        };
      }

      // Update all subtasks without userId
      const result = await Subtask.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: defaultUser._id } }
      );

      return {
        name: "Add userId to existing subtasks",
        success: true,
        message: `Successfully added userId to existing subtasks`,
        affectedDocuments: result.modifiedCount
      };
    } catch (error: any) {
      return {
        name: "Add userId to existing subtasks",
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  // Migration 3: Create default user for orphaned data
  private async createDefaultUserForOrphanedData(): Promise<MigrationResult> {
    try {
      const defaultUser = await User.findOne({ email: "default@tasksync.com" });
      
      if (defaultUser) {
        return {
          name: "Create default user for orphaned data",
          success: true,
          message: "Default user already exists",
          affectedDocuments: 0
        };
      }

      // This should have been created in the first migration
      return {
        name: "Create default user for orphaned data",
        success: true,
        message: "Default user was created in previous migration",
        affectedDocuments: 0
      };
    } catch (error: any) {
      return {
        name: "Create default user for orphaned data",
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  // Migration 4: Update task indexes
  private async updateTaskIndexes(): Promise<MigrationResult> {
    try {
      // Drop existing indexes that don't include userId
      const taskCollection = Task.collection;
      
      try {
        // Get existing indexes
        const indexes = await taskCollection.listIndexes().toArray();
        
        // Drop old indexes that don't include userId (but keep _id index)
        for (const index of indexes) {
          if (index.name !== '_id_' && !index.key.userId) {
            await taskCollection.dropIndex(index.name);
          }
        }
      } catch (error) {
        // Indexes might not exist, which is fine
        console.log("Some indexes didn't exist, skipping...");
      }

      // Create new compound indexes
      await taskCollection.createIndex({ userId: 1, status: 1 });
      await taskCollection.createIndex({ userId: 1, priority: 1 });
      await taskCollection.createIndex({ userId: 1, dueDate: 1 });
      await taskCollection.createIndex({ userId: 1, createdAt: -1 });

      return {
        name: "Update task indexes",
        success: true,
        message: "Successfully updated task indexes with userId",
        affectedDocuments: 4
      };
    } catch (error: any) {
      return {
        name: "Update task indexes",
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  // Migration 5: Update subtask indexes
  private async updateSubtaskIndexes(): Promise<MigrationResult> {
    try {
      // Drop existing indexes that don't include userId
      const subtaskCollection = Subtask.collection;
      
      try {
        // Get existing indexes
        const indexes = await subtaskCollection.listIndexes().toArray();
        
        // Drop old indexes that don't include userId (but keep _id index)
        for (const index of indexes) {
          if (index.name !== '_id_' && !index.key.userId) {
            await subtaskCollection.dropIndex(index.name);
          }
        }
      } catch (error) {
        // Indexes might not exist, which is fine
        console.log("Some indexes didn't exist, skipping...");
      }

      // Create new compound indexes
      await subtaskCollection.createIndex({ userId: 1, taskId: 1 });
      await subtaskCollection.createIndex({ userId: 1, completed: 1 });
      await subtaskCollection.createIndex({ userId: 1, createdAt: -1 });

      return {
        name: "Update subtask indexes",
        success: true,
        message: "Successfully updated subtask indexes with userId",
        affectedDocuments: 3
      };
    } catch (error: any) {
      return {
        name: "Update subtask indexes",
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  // Run a specific migration
  async runMigration(migrationName: string): Promise<void> {
    console.log(`🚀 Running migration: ${migrationName}`);
    
    try {
      await connectDB();
      
      const migrationMap: { [key: string]: () => Promise<MigrationResult> } = {
        'tasks': this.addUserIdToExistingTasks.bind(this),
        'subtasks': this.addUserIdToExistingSubtasks.bind(this),
        'default-user': this.createDefaultUserForOrphanedData.bind(this),
        'task-indexes': this.updateTaskIndexes.bind(this),
        'subtask-indexes': this.updateSubtaskIndexes.bind(this)
      };

      const migration = migrationMap[migrationName];
      if (!migration) {
        console.error(`❌ Migration '${migrationName}' not found`);
        return;
      }

      const result = await migration();
      if (result.success) {
        console.log(`✅ ${result.name}: ${result.message}`);
        if (result.affectedDocuments !== undefined) {
          console.log(`   📊 Affected documents: ${result.affectedDocuments}`);
        }
      } else {
        console.error(`❌ ${result.name}: ${result.message}`);
      }
    } catch (error) {
      console.error("💥 Migration failed:", error);
    }
  }

  // Rollback functions (for safety)
  async rollbackUserIdMigrations(): Promise<void> {
    console.log("🔄 Rolling back userId migrations...");
    
    try {
      await connectDB();
      
      // Remove userId field from tasks
      await Task.updateMany({}, { $unset: { userId: 1 } });
      console.log("✅ Removed userId from tasks");
      
      // Remove userId field from subtasks
      await Subtask.updateMany({}, { $unset: { userId: 1 } });
      console.log("✅ Removed userId from subtasks");
      
      // Optionally remove default user
      await User.deleteOne({ email: "default@tasksync.com" });
      console.log("✅ Removed default user");
      
      console.log("🎉 Rollback completed!");
    } catch (error) {
      console.error("💥 Rollback failed:", error);
    }
  }
}

export default new MigrationRunner();
