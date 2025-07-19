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

// Email Configuration (Nodemailer)
export const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
export const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
export const EMAIL_SECURE = process.env.EMAIL_SECURE === "true" || false;
export const EMAIL_USER = process.env.EMAIL_USER || "";
export const EMAIL_PASS = process.env.EMAIL_PASS || "";
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "TaskSync";

// Twilio WhatsApp Configuration
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
export const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

// OneSignal Push Notification Configuration
export const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "";
export const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || "";

// Razorpay Configuration
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";