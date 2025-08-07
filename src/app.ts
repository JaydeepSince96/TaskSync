import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import passport from "./configs/passport";
import { connectDB } from "./utils/db";
import { PORT, FRONTEND_URL } from "./configs/env";
import { taskRouter } from "./routes/task-route";
import { subtaskRouter } from "./routes/subtask-route";
import { authRouter } from "./routes/auth-route";
import { statsRouter } from "./routes/stats-route";
import { notificationRouter } from "./routes/notification-route";
import { userRouter } from "./routes/user-route";
import { invitationRouter } from "./routes/invitation-route";
import { paymentRouter } from "./routes/payment-route";
import whatsappRouter from "./routes/whatsapp-route";
import taskReminderRouter from "./routes/task-reminder-route";
import { initializeGlobalNotificationScheduler } from "./services/notification-scheduler";
import { initializeGlobalTaskReminderScheduler } from "./services/task-reminder-scheduler";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "https://taskSync.ap-south-1.elasticbeanstalk.com",
  "https://tasksync.org",
  "https://www.tasksync.org",
  "http://tasksync.org",
  "http://www.tasksync.org"
];

// Add FRONTEND_URL from environment if defined
if (FRONTEND_URL && !allowedOrigins.includes(FRONTEND_URL)) {
  allowedOrigins.push(FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true); // Allow curl/postman
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      console.log(`Development mode: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`Production mode: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    console.warn(`Production mode: Blocking origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(passport.initialize());
app.use(helmet());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} — Origin: ${req.get("Origin") || "N/A"}`);
  next();
});

// Rate Limiting - More lenient for payment operations
// Increased limit to accommodate payment flow polling and subscription checks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => [
    "/api/health", 
    "/api/cors-test"
  ].includes(req.path),
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  }
});
app.use("/api/", apiLimiter);

// Root
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskSync API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    domain: req.get("host"),
    cors: {
      origin: req.get("Origin"),
      method: req.method,
      headers: req.headers
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString()
  });
});

// CORS Test
app.get("/api/cors-test", (req, res) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(200).json({
    success: true,
    message: "CORS is working!",
    origin: req.get("Origin"),
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: FRONTEND_URL,
    isDevelopment: isDevelopment,
    corsMode: isDevelopment ? 'DEVELOPMENT' : 'RESTRICTED',
    timestamp: new Date().toISOString(),
    allowedOrigins
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/task", taskRouter);
app.use("/api/subtasks", subtaskRouter);
app.use("/api/stats", statsRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/users", userRouter);
app.use("/api/invitations", invitationRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/task-reminders", taskReminderRouter);

// Initialize notification schedulers
let notificationScheduler: any;
let taskReminderScheduler: any;

// Start Server
connectDB()
  .then(() => {
    // Initialize notification schedulers after DB connection
    notificationScheduler = initializeGlobalNotificationScheduler();
    taskReminderScheduler = initializeGlobalTaskReminderScheduler();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📱 WhatsApp notifications initialized`);
      console.log(`⏰ Daily reminders scheduled for 10am, 3pm, and 7pm`);
      console.log(`🌅 Task reminders scheduled for 8am and 5pm`);
      console.log(`🔍 Overdue task checks every hour`);
    });
  })
  .catch((err: any) => {
    console.error("❌ Failed to connect to DB:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  if (notificationScheduler) {
    notificationScheduler.cleanup();
  }
  if (taskReminderScheduler) {
    // Clean up task reminder scheduler if needed
    console.log('🧹 Cleaning up task reminder scheduler...');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  if (notificationScheduler) {
    notificationScheduler.cleanup();
  }
  if (taskReminderScheduler) {
    // Clean up task reminder scheduler if needed
    console.log('🧹 Cleaning up task reminder scheduler...');
  }
  process.exit(0);
});
