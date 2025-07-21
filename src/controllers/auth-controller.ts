// src/controllers/auth-controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth-service";
import { User } from "../models/user-model";
import { deleteOldProfilePicture, generateFileUrl } from "../middleware/upload-middleware";
import { getUserId } from "../utils/auth-types";
import { InvitationService } from "../services/invitation-service";
import { IInvitation } from "../models/invitation-model";
import { SubscriptionService } from "../services/subscription-service";

export class AuthController {
  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
    private subscriptionService: SubscriptionService
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, invitationToken } = req.body;
      let validInvitation: IInvitation | null = null;
      if (invitationToken) {
        validInvitation = await this.invitationService.validateInvitationToken(invitationToken, email);
        if (!validInvitation) {
          res.status(400).json({ success: false, message: "Invalid or expired invitation token" });
          return;
        }
      }
      const result = await this.authService.register({ name, email, password });
      if (result.success) {
        if (validInvitation) {
          await this.invitationService.acceptInvitation((validInvitation._id as string).toString());
        }
        if (result.data?.user?._id) {
          const trialResult = await this.subscriptionService.initializeTrialSubscription(result.data.user._id.toString());
          if (trialResult.success) {
            console.log(`Trial subscription initialized for user ${result.data.user._id}`);
          } else {
            console.log(`Trial initialization failed for user ${result.data.user._id}: ${trialResult.message}`);
          }
        }
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Register controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login({ email, password });
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error: any) {
      console.error("Login controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: "Refresh token is required" });
        return;
      }
      const result = await this.authService.refreshToken(refreshToken);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error: any) {
      console.error("Refresh token controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const userId = getUserId(req);
      if (!refreshToken || !userId) {
        res.status(400).json({ success: false, message: "Refresh token is required" });
        return;
      }
      const result = await this.authService.logout(userId, refreshToken);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Logout controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      const result = await this.authService.logoutAll(userId);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Logout all controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      // Compute subscriptionStatus for the frontend
      let subscriptionStatus: 'active' | 'trial' | 'trial_expired' | 'inactive' | 'expired' = 'inactive';
      const now = new Date();
      if (user.subscriptionStatus === 'active' && user.subscriptionEndDate && user.subscriptionEndDate > now) {
        subscriptionStatus = 'active';
      } else if (user.subscriptionStatus === 'trial' && user.trialEndDate && user.trialEndDate > now) {
        subscriptionStatus = 'trial';
      } else if (user.subscriptionStatus === 'trial' && user.trialEndDate && user.trialEndDate <= now) {
        subscriptionStatus = 'trial_expired';
      } else if (user.subscriptionStatus === 'expired' || (user.subscriptionEndDate && user.subscriptionEndDate <= now)) {
        subscriptionStatus = 'expired';
      } else {
        subscriptionStatus = 'inactive';
      }
      const userObj = user.toJSON();
      userObj.subscriptionStatus = subscriptionStatus;
      res.status(200).json({ success: true, message: "Profile retrieved successfully", data: { user: userObj } });
    } catch (error: any) {
      console.error("Get profile controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      const { name, email } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
          res.status(400).json({ success: false, message: "Email already taken by another user" });
          return;
        }
        user.email = email;
        user.isEmailVerified = false;
      }
      if (name) user.name = name;
      await user.save();
      res.status(200).json({ success: true, message: "Profile updated successfully", data: { user: user.toJSON() } });
    } catch (error: any) {
      console.error("Update profile controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      const file = req.file;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      if (!file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      if (user.profilePicture) {
        const oldFilename = user.profilePicture.split('/').pop();
        if (oldFilename) {
          deleteOldProfilePicture(oldFilename);
        }
      }
      user.profilePicture = generateFileUrl(file.filename);
      await user.save();
      res.status(200).json({ success: true, message: "Profile picture uploaded successfully", data: { profilePicture: user.profilePicture } });
    } catch (error: any) {
      console.error("Upload profile picture controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      const { currentPassword, newPassword } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      const user = await User.findById(userId).select("+password");
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({ success: false, message: "Current password is incorrect" });
        return;
      }
      user.password = newPassword;
      await user.save();
      await this.authService.logoutAll(userId);
      res.status(200).json({ success: true, message: "Password changed successfully. Please login again." });
    } catch (error: any) {
      console.error("Change password controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      const { password } = req.body;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      const user = await User.findById(userId).select("+password");
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      if (user.password) {
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          res.status(400).json({ success: false, message: "Incorrect password" });
          return;
        }
      }
      if (user.profilePicture) {
        const filename = user.profilePicture.split('/').pop();
        if (filename) {
          deleteOldProfilePicture(filename);
        }
      }
      await User.findByIdAndDelete(userId);
      res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error: any) {
      console.error("Delete account controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  googleAuth = async (req: Request, res: Response): Promise<void> => {
    // This will be handled by passport middleware
  };

  googleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as any;
      if (!user) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_failed`);
        return;
      }
      const result = await this.authService.googleOAuth(user);
      if (result.success && result.data) {
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
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard?auth=success`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_failed`);
      }
    } catch (error: any) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=server_error`);
    }
  };

  getPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Preferences retrieved successfully",
        data: { preferences: user.preferences || {
          emailNotifications: true,
          pushNotifications: true,
          taskReminders: true,
          weeklyReports: false,
          theme: 'system'
        } }
      });
    } catch (error: any) {
      console.error("Get preferences controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      const updates = req.body;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      if (!user.preferences) {
        user.preferences = {
          emailNotifications: true,
          pushNotifications: true,
          taskReminders: true,
          weeklyReports: false,
          theme: 'system'
        };
      }
      Object.keys(updates).forEach(key => {
        if (user.preferences && key in user.preferences) {
          (user.preferences as any)[key] = updates[key];
        }
      });
      await user.save();
      res.status(200).json({ success: true, message: "Preferences updated successfully", data: { preferences: user.preferences } });
    } catch (error: any) {
      console.error("Update preferences controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
}
