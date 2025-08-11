// src/config/env.ts
import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/todo-app";

// Frontend URL Configuration
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

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

// Email Configuration (Nodemailer) - Legacy SMTP
// Only configure if explicitly set (no defaults to avoid conflicts with AWS SES)
export const EMAIL_HOST = process.env.EMAIL_HOST;
export const EMAIL_PORT = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : undefined;
export const EMAIL_SECURE = process.env.EMAIL_SECURE === "true";
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "TaskSync";

// Professional Email Service Providers
// SendGrid Configuration
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
export const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "";
export const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "TaskSync";

// Mailgun Configuration
export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "";
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "";
export const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || "";

// AWS SES Configuration
export const AWS_SES_ACCESS_KEY_ID = process.env.AWS_SES_ACCESS_KEY_ID || "";
export const AWS_SES_SECRET_ACCESS_KEY = process.env.AWS_SES_SECRET_ACCESS_KEY || "";
export const AWS_SES_REGION = process.env.AWS_SES_REGION || "us-east-1";
export const AWS_SES_FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || "";

// Twilio WhatsApp Configuration
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
export const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

// OneSignal Push Notification Configuration
export const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "";
export const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || "";

// Firebase Cloud Messaging (FCM) Configuration
export const FIREBASE_SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./firebase-service-account.json";
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "";
export const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || "";
export const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "";

// Razorpay Configuration
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";