import mongoose, { Schema, Document } from "mongoose";

export interface ISubtask extends Document {
  _id: string;
  title: string;
  completed: boolean;
  taskId: mongoose.Types.ObjectId; // Reference to the main task
  userId: mongoose.Types.ObjectId; // Reference to User
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubtaskSchema = new Schema<ISubtask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    completed: {
      type: Boolean,
      default: false
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true // Index for better query performance
    },
    startDate: {
      type: Date,
      required: false
    },
    endDate: {
      type: Date,
      required: false
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
SubtaskSchema.index({ taskId: 1 });
SubtaskSchema.index({ taskId: 1, completed: 1 });
SubtaskSchema.index({ userId: 1, taskId: 1 }); // Compound index for user-specific subtasks

const Subtask = mongoose.model<ISubtask>("Subtask", SubtaskSchema);
export default Subtask;
