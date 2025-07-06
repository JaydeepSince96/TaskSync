// src/models/Todo.ts
import { Schema, model, Document } from "mongoose";

export enum TodoLabel {
  LESS_IMPORTANT = "less important",
  IMPORTANT = "important",
  VERY_IMPORTANT = "very important"
}

export interface ITodo extends Document {
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  label: TodoLabel;
  dueDate: Date;
}

const TodoSchema = new Schema<ITodo>(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    label: { 
      type: String, 
      enum: Object.values(TodoLabel),
      default: TodoLabel.LESS_IMPORTANT 
    },
    dueDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<ITodo>("Todo", TodoSchema);