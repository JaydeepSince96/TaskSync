// src/services/auth-service.ts
import { User, IUser } from "../models/user-model";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRE, JWT_REFRESH_EXPIRE } from "../configs/env";
import { Types } from "mongoose";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Partial<IUser>;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthService {
  // Register new user
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists"
        };
      }

      // Create new user
      const newUser = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        isEmailVerified: true // For now, auto-verify. You can add email verification later
      });

      await newUser.save();

      // Generate tokens
      const { accessToken, refreshToken } = newUser.generateTokens();

      // Save refresh token
      newUser.refreshTokens.push(refreshToken);
      await newUser.save();

      // Remove sensitive data
      const userResponse = newUser.toJSON();

      return {
        success: true,
        message: "User registered successfully",
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      };
    } catch (error: any) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error.message || "Registration failed"
      };
    }
  }

  // Login user
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      // Find user by email and include password
      const user = await User.findOne({ email: loginData.email }).select("+password");
      if (!user) {
        return {
          success: false,
          message: "Invalid email or password"
        };
      }

      // Check password
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: "Invalid email or password"
        };
      }

      // Update last login
      user.lastLogin = new Date();

      // Generate new tokens
      const { accessToken, refreshToken } = user.generateTokens();

      // Save refresh token
      user.refreshTokens.push(refreshToken);

      // Limit refresh tokens (keep only last 5)
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
      }

      await user.save();

      // Remove sensitive data
      const userResponse = user.toJSON();

      return {
        success: true,
        message: "Login successful",
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      };
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.message || "Login failed"
      };
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.userId);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        return {
          success: false,
          message: "Invalid refresh token"
        };
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = user.generateTokens();

      // Replace old refresh token with new one
      const tokenIndex = user.refreshTokens.indexOf(refreshToken);
      user.refreshTokens[tokenIndex] = newRefreshToken;
      await user.save();

      return {
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken,
          refreshToken: newRefreshToken
        }
      };
    } catch (error: any) {
      console.error("Token refresh error:", error);
      return {
        success: false,
        message: "Invalid or expired refresh token"
      };
    }
  }

  // Logout user (remove refresh token)
  async logout(userId: string, refreshToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found"
        };
      }

      // Remove the specific refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await user.save();

      return {
        success: true,
        message: "Logout successful"
      };
    } catch (error: any) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Logout failed"
      };
    }
  }

  // Logout from all devices (remove all refresh tokens)
  async logoutAll(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found"
        };
      }

      // Remove all refresh tokens
      user.refreshTokens = [];
      await user.save();

      return {
        success: true,
        message: "Logged out from all devices successfully"
      };
    } catch (error: any) {
      console.error("Logout all error:", error);
      return {
        success: false,
        message: "Logout failed"
      };
    }
  }

  // Google OAuth helper (to be used with passport)
  async googleOAuth(profile: any): Promise<AuthResponse> {
    try {
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });

      if (user) {
        // Update Google ID if user exists but doesn't have one
        if (!user.googleId) {
          user.googleId = profile.id;
          user.isEmailVerified = true;
          await user.save();
        }
      } else {
        // Create new user
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          isEmailVerified: true,
          profilePicture: profile.photos[0]?.value || null
        });
        await user.save();
      }

      // Generate tokens
      const { accessToken, refreshToken } = user.generateTokens();

      // Save refresh token
      user.refreshTokens.push(refreshToken);
      user.lastLogin = new Date();
      await user.save();

      return {
        success: true,
        message: "Google authentication successful",
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken
        }
      };
    } catch (error: any) {
      console.error("Google OAuth error:", error);
      return {
        success: false,
        message: "Google authentication failed"
      };
    }
  }
}
