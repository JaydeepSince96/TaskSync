import mongoose, { Schema, Document } from "mongoose";

export interface ISubtask extends Document {
  _id: string;
  title: string;
  completed: boolean;
  taskId: mongoose.Types.ObjectId; // Reference to the main task
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

const Subtask = mongoose.model<ISubtask>("Subtask", SubtaskSchema);
export default Subtask;
