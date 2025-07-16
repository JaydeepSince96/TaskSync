// src/controllers/user-controller.ts
import { Request, Response, RequestHandler } from "express";
import { User } from "../models/user-model";
import { getUserId } from "../utils/auth-types";

class UserController {
  // Get all users for assignment dropdown (email and name only)
  getAvailableUsers: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      // Get all users except the current user, return only necessary fields
      const users = await User.find(
        { _id: { $ne: userId } },
        { name: 1, email: 1, profilePicture: 1 }
      ).sort({ name: 1 });

      res.status(200).json({
        success: true,
        data: users,
        message: "Available users retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting available users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get available users"
      });
    }
  };

  // Search users by email or name for autocomplete
  searchUsers: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      const { query } = req.query;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: "Query must be at least 2 characters long"
        });
        return;
      }

      // Search users by email or name (case-insensitive)
      const users = await User.find(
        {
          _id: { $ne: userId },
          $or: [
            { email: { $regex: query.trim(), $options: 'i' } },
            { name: { $regex: query.trim(), $options: 'i' } }
          ]
        },
        { name: 1, email: 1, profilePicture: 1 }
      )
      .limit(10) // Limit results for performance
      .sort({ name: 1 });

      res.status(200).json({
        success: true,
        data: users,
        message: "Users found successfully"
      });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search users"
      });
    }
  };
}

export default new UserController();
