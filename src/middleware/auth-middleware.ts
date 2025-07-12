// src/middleware/auth-middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env";
import { User } from "../models/user-model";

// JWT Authentication Middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required"
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found. Please login again."
      });
      return;
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error: any) {
    console.error("Authentication error:", error);
    
    if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    } else if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Authentication failed"
      });
    }
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          name: decoded.name
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based access control (for future use)
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    // For now, all authenticated users have access
    // In the future, you can add role checking here
    next();
  };
};
