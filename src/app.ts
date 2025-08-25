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
import contactRouter from "./routes/contact-route";
import { initializeGlobalNotificationScheduler } from "./services/notification-scheduler";
import { initializeGlobalTaskReminderScheduler } from "./services/task-reminder-scheduler";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const app = express();

// Trust proxy for AWS Elastic Beanstalk (fixes rate limiting issues)
app.set('trust proxy', 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
  "https://taskSync.ap-south-1.elasticbeanstalk.com",
  "https://tasksync.org",
  "https://www.tasksync.org",
  "http://tasksync.org",
  "http://www.tasksync.org",
  "https://api.tasksync.org",
  "https://app.tasksync.org"
];

// Add FRONTEND_URL from environment if defined
if (FRONTEND_URL && !allowedOrigins.includes(FRONTEND_URL)) {
  allowedOrigins.push(FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🔍 CORS blocked origin:', origin);
      callback(null, true); // Temporarily allow all origins for debugging
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};

// CORS Middleware - Aggressive fix for all requests
app.use((req, res, next) => {
  // Set CORS headers for ALL requests
  const origin = req.get('Origin');
  
  // Allow specific origins or all origins for debugging
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Requested-With, X-User-Context');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔍 CORS preflight request handled:', req.path);
    res.status(200).end();
    return;
  }
  
  next();
});

// Backup CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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
    "/api/health"
  ].includes(req.path),
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  // Fix for AWS Elastic Beanstalk proxy issues
  keyGenerator: (req) => {
    // Use X-Forwarded-For if available, otherwise use IP
    return req.headers['x-forwarded-for'] as string || req.ip || req.connection.remoteAddress || 'unknown';
  }
});
app.use("/api/", apiLimiter);

// Root
app.get("/", (req, res) => {
  console.log(`🏠 Root endpoint requested at ${new Date().toISOString()}`);
  console.log(`🏠 Path: ${req.path}`);
  console.log(`🏠 Method: ${req.method}`);
  console.log(`🏠 Headers:`, req.headers);
  
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
  
  console.log(`🏠 Root endpoint response sent successfully`);
});

// Health check endpoint
app.get("/health", (req, res) => {
  console.log(`🏥 Health check requested at ${new Date().toISOString()}`);
  console.log(`🏥 Uptime: ${process.uptime()}s`);
  console.log(`🏥 Memory:`, process.memoryUsage());
  console.log(`🏥 Database: ${mongoose.connection.readyState === 1 ? "connected" : "disconnected"}`);
  
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
  
  console.log(`🏥 Health check response sent successfully`);
});

// Enhanced Health Check for Elastic Beanstalk
app.get("/api/health", (req, res) => {
  console.log(`🏥 API Health check requested at ${new Date().toISOString()}`);
  
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryStatus = memoryUsage.heapUsed < 500 * 1024 * 1024 ? "healthy" : "high"; // 500MB threshold
    
    // Check uptime
    const uptime = process.uptime();
    const uptimeStatus = uptime > 60 ? "stable" : "starting"; // 60 seconds threshold
    
    // Determine overall health
    const isHealthy = dbStatus === "connected" && memoryStatus === "healthy" && uptimeStatus === "stable";
    
    const healthResponse = {
      success: true,
      message: isHealthy ? "Server is healthy" : "Server has issues",
      timestamp: new Date().toISOString(),
      status: {
        overall: isHealthy ? "healthy" : "degraded",
        database: dbStatus,
        memory: memoryStatus,
        uptime: uptimeStatus
      },
      metrics: {
        uptime: Math.round(uptime),
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
          external: Math.round(memoryUsage.external / 1024 / 1024) + "MB"
        },
        database: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host || "unknown"
        }
      }
    };
    
    // Set appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(healthResponse);
    
    console.log(`🏥 API Health check response sent successfully - Status: ${healthResponse.status.overall}`);
    
  } catch (error) {
    console.error(`🏥 Health check error:`, error);
    res.status(503).json({
      success: false,
      message: "Health check failed",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Email Service Status Check (temporary diagnostic endpoint)
app.get("/api/email-status", (req, res) => {
  try {
    const { EmailService } = require('./services/email-service');
    const emailService = new EmailService();
    const status = emailService.getStatus();
    
    res.status(200).json({
      success: true,
      message: "Email service status",
      data: {
        ...status,
        environmentVariables: {
          sendgrid: {
            hasApiKey: !!process.env.SENDGRID_API_KEY,
            hasFromEmail: !!process.env.SENDGRID_FROM_EMAIL
          },
          mailgun: {
            hasApiKey: !!process.env.MAILGUN_API_KEY,
            hasDomain: !!process.env.MAILGUN_DOMAIN,
            hasFromEmail: !!process.env.MAILGUN_FROM_EMAIL
          },
          awsSes: {
            hasAccessKey: !!process.env.AWS_SES_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SES_SECRET_ACCESS_KEY,
            hasFromEmail: !!process.env.AWS_SES_FROM_EMAIL,
            region: process.env.AWS_SES_REGION
          },
          smtp: {
            hasUser: !!process.env.EMAIL_USER,
            hasPass: !!process.env.EMAIL_PASS,
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT
          }
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to get email service status",
      error: error.message
    });
  }
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
app.use("/api/contact", contactRouter);

// Initialize notification schedulers
let notificationScheduler: any;
let taskReminderScheduler: any;

// Start Server
connectDB()
  .then(() => {
    // Initialize notification schedulers after DB connection
    notificationScheduler = initializeGlobalNotificationScheduler();
    taskReminderScheduler = initializeGlobalTaskReminderScheduler();
    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
      console.log(`📱 WhatsApp notifications initialized`);
      console.log(`⏰ Daily reminders scheduled for 10am, 3pm, and 7pm`);
      console.log(`🌅 Task reminders scheduled for 8am and 5pm`);
      console.log(`🔍 Overdue task checks every hour`);
      console.log(`✅ Application startup completed successfully`);
      console.log(`✅ Ready to accept requests`);
    }).on('error', (error) => {
      console.error(`❌ Server startup error:`, error);
      process.exit(1);
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
