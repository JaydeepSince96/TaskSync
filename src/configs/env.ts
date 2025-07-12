// src/config/env.ts
import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/todo-app";

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-this-in-production";
export const JWT_EXPIRE = process.env.JWT_EXPIRE || "1h";
export const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || "7d";

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

// File Upload Configuration
export const UPLOAD_PATH = process.env.UPLOAD_PATH || "uploads/";
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "5000000"); // 5MB