// src/models/user-model.ts
import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for Google OAuth users
  profilePicture?: string;
  googleId?: string; // For Google OAuth
  isEmailVerified: boolean;
  refreshTokens: string[]; // Array to store multiple refresh tokens
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskReminders: boolean;
    weeklyReports: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateTokens(): { accessToken: string; refreshToken: string };
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address"
      ]
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      select: false // Don't include password in queries by default
    },
    profilePicture: {
      type: String,
      default: null
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    refreshTokens: [{
      type: String
    }],
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      taskReminders: {
        type: Boolean,
        default: true
      },
      weeklyReports: {
        type: Boolean,
        default: false
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      }
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        return ret;
      }
    }
  }
);

// Pre-save middleware to hash password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT tokens method
UserSchema.methods.generateTokens = function () {
  const jwt = require("jsonwebtoken");
  const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRE, JWT_REFRESH_EXPIRE } = require("../configs/env");
  
  const payload = {
    userId: this._id,
    email: this.email,
    name: this.name
  };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE });
  
  return { accessToken, refreshToken };
};

export const User = model<IUser>("User", UserSchema);
