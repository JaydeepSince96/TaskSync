// src/utils/db.ts
import mongoose from "mongoose";
import { MONGO_URI } from "../configs/env";

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", MONGO_URI ? "Set" : "Not set");
    
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
    
    // Add connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};