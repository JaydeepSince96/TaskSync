// src/controllers/user-controller.ts
import { Request, Response, RequestHandler } from "express";
import { User } from "../models/user-model";
import { getUserId } from "../utils/auth-types";
import { InvitationService } from "../services/invitation-service";

export class UserController {
  constructor(private invitationService: InvitationService) {}

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

  // Search users by email or name for autocomplete (only invited users)
  searchUsers: RequestHandler = async (req, res) => {
    try {
      console.log('🔍 User search request received:', {
        method: req.method,
        url: req.url,
        query: req.query,
        origin: req.get('Origin'),
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        authLength: req.headers.authorization?.length || 0
      });

      const userId = getUserId(req);
      let { query } = req.query;
      
      // Decode URL-encoded characters if present
      if (typeof query === 'string') {
        query = decodeURIComponent(query);
      }
      
      // Debug logging to check what query is received
      console.log('📊 Received search query:', {
        raw: req.query.query,
        decoded: query,
        type: typeof query,
        trimmed: typeof query === 'string' ? query.trim() : 'N/A'
      });
      
      if (!userId) {
        console.log('❌ No user ID found in request');
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        console.log('❌ Invalid query:', query);
        res.status(400).json({
          success: false,
          message: "Query must be at least 2 characters long"
        });
        return;
      }

      console.log('✅ Query validation passed, fetching users for assignment...');

      // Get all registered users for assignment (not just invited users)
      const allUsers = await User.find({}, { name: 1, email: 1, profilePicture: 1 }).sort({ name: 1 });
      
      console.log('📊 All users fetched:', {
        totalUsers: allUsers.length
      });
      
      // Filter users based on the search query
      const filteredUsers = allUsers.filter(user => {
        const searchTerm = query.trim().toLowerCase();
        return (
          user.email.toLowerCase().includes(searchTerm) ||
          user.name.toLowerCase().includes(searchTerm)
        );
      });

      // Debug logging to check search results
      console.log('📊 Search results:', {
        query: query.trim(),
        currentUserId: userId,
        totalUsers: allUsers.length,
        filteredResults: filteredUsers.length,
        resultEmails: filteredUsers.map(u => u.email)
      });

      console.log('✅ Sending search response');
      
      // If no users found, return empty array but still success
      if (filteredUsers.length === 0) {
        console.log('📊 No users found matching query');
        res.status(200).json({
          success: true,
          data: [],
          message: "No users found matching your search"
        });
      } else {
        res.status(200).json({
          success: true,
          data: filteredUsers,
          message: "Users found successfully"
        });
      }
    } catch (error) {
      console.error("❌ Error searching users:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
      
      res.status(500).json({
        success: false,
        message: "Failed to search users",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  // Register FCM device token for push notifications
  registerDeviceToken: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      const { deviceToken } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      if (!deviceToken || typeof deviceToken !== 'string') {
        res.status(400).json({ success: false, message: "Device token is required" });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      if (!user.deviceTokens.includes(deviceToken)) {
        user.deviceTokens.push(deviceToken);
        await user.save();
      }
      res.status(200).json({ success: true, message: "Device token registered successfully" });
    } catch (error) {
      console.error("Error registering device token:", error);
      res.status(500).json({ success: false, message: "Failed to register device token" });
    }
  };
}
