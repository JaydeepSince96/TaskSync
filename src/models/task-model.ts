// src/models/Todo.ts
import { Schema, model, Document, Types } from "mongoose";

export enum TaskLabel {
  LOW_PRIORITY = "low priority",
  MEDIUM_PRIORITY = "medium priority",
  HIGH_PRIORITY = "high priority"
}

export interface ITask extends Document {
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  label: TaskLabel;
  startDate: Date;
  dueDate: Date;
  userId: Types.ObjectId; // Reference to User (task creator)
  assignedTo?: Types.ObjectId[]; // Array of References to Users (assigned users) - UPDATED FOR MULTIPLE ASSIGNMENTS
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    label: { 
      type: String, 
      enum: Object.values(TaskLabel),
      default: TaskLabel.LOW_PRIORITY 
    },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true // Index for better query performance
    },
    assignedTo: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false,
      index: true // Index for better query performance
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for user-specific queries
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, completed: 1 });
TaskSchema.index({ userId: 1, label: 1 });
TaskSchema.index({ assignedTo: 1, completed: 1 }); // Index for assigned tasks queries

export default model<ITask>("Task", TaskSchema);