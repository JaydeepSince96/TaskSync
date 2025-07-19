// src/controllers/auth-controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth-service";
import { User } from "../models/user-model";
import { deleteOldProfilePicture, generateFileUrl } from "../middleware/upload-middleware";
import { getUserId } from "../utils/auth-types";
import InvitationService from "../services/invitation-service";
import { IInvitation } from "../models/invitation-model";

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, invitationToken } = req.body;

      // If an invitation token is provided, validate it
      let validInvitation: IInvitation | null = null;
      if (invitationToken) {
        validInvitation = await InvitationService.validateInvitationToken(invitationToken, email);
        if (!validInvitation) {
          res.status(400).json({
            success: false,
            message: "Invalid or expired invitation token"
          });
          return;
        }
      }

      const result = await AuthService.register({ name, email, password });

      if (result.success) {
        // If registration was successful and there was a valid invitation, mark it as accepted
        if (validInvitation) {
          await InvitationService.acceptInvitation((validInvitation._id as string).toString());
        }
        
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Register controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error: any) {
      console.error("Login controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Refresh access token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: "Refresh token is required"
        });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error: any) {
      console.error("Refresh token controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Logout user
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = getUserId(req);

      if (!refreshToken || !userId) {
        res.status(400).json({
          success: false,
          message: "Refresh token is required"
        });
        return;
      }

      const result = await AuthService.logout(userId, refreshToken);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Logout controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Logout from all devices
  static async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const result = await AuthService.logoutAll(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Logout all controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: { user: user.toJSON() }
      });
    } catch (error: any) {
      console.error("Get profile controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { name, email } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
          res.status(400).json({
            success: false,
            message: "Email already taken by another user"
          });
          return;
        }
        user.email = email;
        user.isEmailVerified = false; // Reset email verification if email changed
      }

      if (name) user.name = name;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user: user.toJSON() }
      });
    } catch (error: any) {
      console.error("Update profile controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Upload profile picture
  static async uploadProfilePicture(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const file = req.file;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }

      // Delete old profile picture if exists
      if (user.profilePicture) {
        const oldFilename = user.profilePicture.split('/').pop();
        if (oldFilename) {
          deleteOldProfilePicture(oldFilename);
        }
      }

      // Update user profile picture
      user.profilePicture = generateFileUrl(file.filename);
      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        data: {
          profilePicture: user.profilePicture
        }
      });
    } catch (error: any) {
      console.error("Upload profile picture controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const user = await User.findById(userId).select("+password");
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
        return;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Logout from all devices for security
      await AuthService.logoutAll(userId);

      res.status(200).json({
        success: true,
        message: "Password changed successfully. Please login again."
      });
    } catch (error: any) {
      console.error("Change password controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Delete account
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { password } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const user = await User.findById(userId).select("+password");
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }

      // Verify password for account deletion
      if (user.password) {
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          res.status(400).json({
            success: false,
            message: "Incorrect password"
          });
          return;
        }
      }

      // Delete profile picture if exists
      if (user.profilePicture) {
        const filename = user.profilePicture.split('/').pop();
        if (filename) {
          deleteOldProfilePicture(filename);
        }
      }

      // Delete user account
      await User.findByIdAndDelete(userId);

      res.status(200).json({
        success: true,
        message: "Account deleted successfully"
      });
    } catch (error: any) {
      console.error("Delete account controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Google OAuth - Initiate authentication
  static async googleAuth(req: Request, res: Response): Promise<void> {
    // This will be handled by passport middleware
    // Just a placeholder for route definition
  }

  // Google OAuth - Handle callback
  static async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;
      
      if (!user) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_failed`);
        return;
      }

      const result = await AuthService.googleOAuth(user);

      if (result.success && result.data) {
        // Set HTTP-only cookies for tokens
        res.cookie('accessToken', result.data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', result.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Redirect to frontend with success
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard?auth=success`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_failed`);
      }
    } catch (error: any) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=server_error`);
    }
  }

  // Get user preferences
  static async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Preferences retrieved successfully",
        data: { 
          preferences: user.preferences || {
            emailNotifications: true,
            pushNotifications: true,
            taskReminders: true,
            weeklyReports: false,
            theme: 'system'
          }
        }
      });
    } catch (error: any) {
      console.error("Get preferences controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Update user preferences
  static async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const updates = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }

      // Update preferences
      if (!user.preferences) {
        user.preferences = {
          emailNotifications: true,
          pushNotifications: true,
          taskReminders: true,
          weeklyReports: false,
          theme: 'system'
        };
      }

      // Apply updates
      Object.keys(updates).forEach(key => {
        if (user.preferences && key in user.preferences) {
          (user.preferences as any)[key] = updates[key];
        }
      });

      await user.save();

      res.status(200).json({
        success: true,
        message: "Preferences updated successfully",
        data: { preferences: user.preferences }
      });
    } catch (error: any) {
      console.error("Update preferences controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
}
