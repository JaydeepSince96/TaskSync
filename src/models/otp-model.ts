// src/models/otp-model.ts
import { Schema, model, Document } from "mongoose";

export interface IOTP extends Document {
  email: string;
  otp: string;
  type: 'registration' | 'password_reset';
  userData?: {
    name: string;
    password: string;
    invitationToken?: string;
  };
  attempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address"
      ]
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      length: [6, "OTP must be exactly 6 digits"]
    },
    type: {
      type: String,
      enum: ['registration', 'password_reset'],
      required: [true, "OTP type is required"]
    },
    userData: {
      name: {
        type: String,
        trim: true
      },
      password: {
        type: String
      },
      invitationToken: {
        type: String
      }
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, "Maximum 5 attempts allowed"]
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
OTPSchema.index({ email: 1, type: 1 });

// TTL index to automatically delete expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = model<IOTP>("OTP", OTPSchema);
