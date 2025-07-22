// src/index.ts
import express from "express";
import cors from "cors";
import path from "path";
import passport from "./configs/passport";
import { connectDB } from "./utils/db";
import { PORT } from "./configs/env";
import { taskRouter } from "./routes/task-route";
import { subtaskRouter } from "./routes/subtask-route";
import { authRouter } from "./routes/auth-route";
import { statsRouter } from "./routes/stats-route";
import { notificationRouter } from "./routes/notification-route";
import { userRouter } from "./routes/user-route";
import { invitationRouter } from "./routes/invitation-route";
import { paymentRouter } from "./routes/payment-route";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Local development
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      // Production frontend domains (add your frontend domain here)
      "https://your-frontend-domain.com",
      "https://www.your-frontend-domain.com"
    ];
    
    // For development and testing, allow all origins
    // TODO: Restrict this in production
    return callback(null, true);
    
    // Production CORS logic (uncomment when deploying to production)
    /*
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
    */
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize());

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.get('Origin') || 'No Origin'}`);
  next();
});

// Serve static files (for profile pictures)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Security middleware
app.use(helmet());
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  }
});
app.use("/api/", apiLimiter);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/task", taskRouter);
app.use("/api", subtaskRouter);
app.use("/api", statsRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/users", userRouter);
app.use("/api/invitations", invitationRouter);
app.use("/api/payment", paymentRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    cors: {
      origin: req.get('Origin'),
      method: req.method,
      headers: req.headers
    }
  });
});

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CORS is working!",
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB and start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});