// src/models/Todo.ts
import { Schema, model, Document } from "mongoose";

export enum TaskLabel {
  LOW_PRIORITY = "low priority",
  MEDIUM_PRIORITYNT = "medium priority",
  HIGH_PRIORITY = "high priority",
  PRIORITY = "priority"
}

export interface ITask extends Document {
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  label: TaskLabel;
  startDate:Date;
  dueDate: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    label: { 
      type: String, 
      enum: Object.values(TaskLabel),
      default: TaskLabel.PRIORITY 
    },
    startDate:{type:Date,required:true},
    dueDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<ITask>("Task", TaskSchema);