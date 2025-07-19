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

      // Get all users including the current user, return only necessary fields
      const users = await User.find(
        {},
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
      let { query } = req.query;
      
      // Decode URL-encoded characters if present
      if (typeof query === 'string') {
        query = decodeURIComponent(query);
      }
      
      // Debug logging to check what query is received
      console.log('Received search query:', {
        raw: req.query.query,
        decoded: query,
        type: typeof query,
        trimmed: typeof query === 'string' ? query.trim() : 'N/A'
      });
      
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

      // Search users by email or name (case-insensitive), including current user
      const users = await User.find(
        {
          $or: [
            { email: { $regex: query.trim(), $options: 'i' } },
            { name: { $regex: query.trim(), $options: 'i' } }
          ]
        },
        { name: 1, email: 1, profilePicture: 1 }
      )
      .limit(10) // Limit results for performance
      .sort({ name: 1 });

      // Debug logging to check search results
      console.log('Search results:', {
        query: query.trim(),
        currentUserId: userId,
        foundUsers: users.length,
        userEmails: users.map(u => u.email),
        includesCurrentUser: users.some(u => (u as any)._id.toString() === userId)
      });

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
