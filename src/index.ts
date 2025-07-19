// src/index.ts
import express from "express";
import cors from "cors";
import path from "path";
import passport from "./configs/passport";
import { connectDB } from "./utils/db";
import { PORT } from "./configs/env";
import taskRoute from "./routes/task-route";
import subtaskRoute from "./routes/subtask-route";
import authRoute from "./routes/auth-route";
import statsRoute from "./routes/stats-route";
import notificationRoute from "./routes/notification-route";
import userRoute from "./routes/user-route";
import invitationRoute from "./routes/invitation-route";
import paymentRoute from "./routes/payment-route";

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
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

// Routes
app.use("/api/auth", authRoute);
app.use("/api/task", taskRoute);
app.use("/api", subtaskRoute);
app.use("/api", statsRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/users", userRoute);
app.use("/api/invitations", invitationRoute);
app.use("/api/payment", paymentRoute);

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