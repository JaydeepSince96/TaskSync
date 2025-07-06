// src/utils/db.ts
import mongoose from "mongoose";
import { MONGO_URI } from "../configs/env";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};