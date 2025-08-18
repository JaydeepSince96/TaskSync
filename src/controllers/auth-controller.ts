// src/controllers/auth-controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth-service";
import { User } from "../models/user-model";
import { deleteOldProfilePicture, generateFileUrl } from "../middleware/upload-middleware";
import { getUserId } from "../utils/auth-types";
import { InvitationService } from "../services/invitation-service";
import { IInvitation } from "../models/invitation-model";
import { SubscriptionService } from "../services/subscription-service";
import { OTPService } from "../services/otp-service";

export class AuthController {
  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
    private subscriptionService: SubscriptionService,
    private otpService: OTPService
  ) {}

  // Step 1: Send OTP for registration
  sendRegistrationOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, invitationToken } = req.body;
      
      // Validate invitation token if provided
      let validInvitation: IInvitation | null = null;
      if (invitationToken) {
        validInvitation = await this.invitationService.validateInvitationToken(invitationToken, email);
        if (!validInvitation) {
          res.status(400).json({ success: false, message: "Invalid or expired invitation token" });
          return;
        }
      }

      // Send OTP
      const result = await this.otpService.sendRegistrationOTP(email, { 
        name, 
        password, 
        invitationToken 
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Send registration OTP controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  // Step 2: Verify OTP and complete registration
  verifyRegistrationOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body;

      // Verify OTP
      const otpResult = await this.otpService.verifyRegistrationOTP(email, otp);
      if (!otpResult.success) {
        res.status(400).json(otpResult);
        return;
      }

      // Extract user data from OTP verification
      const userData = otpResult.data.userData;
      let validInvitation: IInvitation | null = null;

      // Re-validate invitation if token exists
      if (userData.invitationToken) {
        validInvitation = await this.invitationService.validateInvitationToken(userData.invitationToken, email);
        if (!validInvitation) {
          res.status(400).json({ success: false, message: "Invalid or expired invitation token" });
          return;
        }
      }

      // Complete user registration
      const result = await this.authService.register({ 
        name: userData.name, 
        email, 
        password: userData.password 
      });

      if (result.success) {
        // Accept invitation if exists
        if (validInvitation) {
          await this.invitationService.acceptInvitation((validInvitation._id as string).toString());
        }
        
        // Initialize trial subscription for new user
        if (result.data?.user?._id) {
          try {
            const trialResult = await this.subscriptionService.initializeTrialSubscription(result.data.user._id.toString());
            if (trialResult.success) {
              console.log(`✅ Trial subscription initialized for user ${result.data.user._id}`);
            } else {
              console.log(`⚠️ Trial initialization failed for user ${result.data.user._id}: ${trialResult.message}`);
            }
          } catch (trialError) {
            console.error(`❌ Error initializing trial for user ${result.data.user._id}:`, trialError);
          }
        }
        
        res.status(201).json({
          success: true,
          message: "Registration completed successfully! Email verified.",
          data: result.data
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Verify registration OTP controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  // Resend OTP
  resendRegistrationOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      const result = await this.otpService.resendRegistrationOTP(email);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Resend registration OTP controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  // Legacy registration endpoint (for backward compatibility)
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
        
        // Initialize trial subscription for new user
        if (result.data?.user?._id) {
          try {
            const trialResult = await this.subscriptionService.initializeTrialSubscription(result.data.user._id.toString());
            if (trialResult.success) {
              console.log(`✅ Trial subscription initialized for user ${result.data.user._id}`);
            } else {
              console.log(`⚠️ Trial initialization failed for user ${result.data.user._id}: ${trialResult.message}`);
            }
          } catch (trialError) {
            console.error(`❌ Error initializing trial for user ${result.data.user._id}:`, trialError);
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
      const { name, email, phoneNumber } = req.body;
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
      if (phoneNumber) {
        // Validate phone number format
        if (!phoneNumber.startsWith('+')) {
          res.status(400).json({ 
            success: false, 
            message: "Phone number must be in international format (e.g., +1234567890)" 
          });
          return;
        }
        user.phoneNumber = phoneNumber;
      }
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
        console.log('Google callback: No user found in request');
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_failed`);
        return;
      }
      
      console.log('Google callback: Processing user:', user.email);
      
      // Create a profile-like object from the user data
      const profile = {
        id: user.googleId,
        emails: [{ value: user.email }],
        displayName: user.name,
        photos: user.profilePicture ? [{ value: user.profilePicture }] : []
      };
      
      const result = await this.authService.googleOAuth(profile);
      
      if (result.success && result.data) {
        console.log('Google callback: Auth successful, user data:', {
          email: result.data.user.email,
          isFirstTimeUser: result.data.isFirstTimeUser,
          isFirstTimeGoogleAuth: result.data.isFirstTimeGoogleAuth,
          hasActiveSubscription: result.data.hasActiveSubscription,
          needsPaymentRedirect: result.data.needsPaymentRedirect
        });
        
        // Set tokens as cookies for server-side access
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

        // Also set tokens as non-httpOnly cookies for frontend access
        res.cookie('frontend_accessToken', result.data.accessToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });
        res.cookie('frontend_refreshToken', result.data.refreshToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Determine redirect based on user status
        if (result.data.needsPaymentRedirect) {
          // User needs to go to payment page (new user, first-time Google Auth, or no active subscription)
          if (result.data.isFirstTimeUser || result.data.isFirstTimeGoogleAuth) {
            console.log('Google callback: Redirecting to login page (new user or first-time Google Auth)');
            res.redirect(`${process.env.FRONTEND_URL || 'https://tasksync.org'}/login?auth=success&new_user=true`);
          } else {
            console.log('Google callback: Redirecting to login page (no active subscription)');
            res.redirect(`${process.env.FRONTEND_URL || 'https://tasksync.org'}/login?auth=success&subscription_expired=true`);
          }
        } else {
          // User has active subscription - redirect to dashboard
          console.log('Google callback: Redirecting to dashboard (active subscription)');
          res.redirect(`${process.env.FRONTEND_URL || 'https://tasksync.org'}/dashboard?auth=success`);
        }
      } else {
        console.log('Google callback: Auth failed:', result.message);
        res.redirect(`${process.env.FRONTEND_URL || 'https://tasksync.org'}/login?error=auth_failed`);
      }
    } catch (error: any) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'https://tasksync.org'}/login?error=server_error`);
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
