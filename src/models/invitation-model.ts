// src/models/invitation-model.ts
import { Schema, model, Document, Types } from "mongoose";

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted", 
  EXPIRED = "expired"
}

export interface IInvitation extends Document {
  email: string;
  invitedBy: Types.ObjectId; // User who sent the invitation
  token: string; // Unique invitation token for signup
  status: InvitationStatus;
  expiresAt: Date;
  isPublicInvitation?: boolean; // Flag to identify public invitations
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    email: { 
      type: String, 
      required: true, 
      lowercase: true,
      trim: true,
      index: true // Index for faster email lookups
    },
    invitedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true // Index for finding invitations by user
    },
    token: { 
      type: String, 
      required: true, 
      unique: true,
      index: true // Index for token lookups during signup
    },
    status: { 
      type: String, 
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
      index: true // Index for filtering by status
    },
    expiresAt: { 
      type: Date, 
      required: true,
      index: true // Index for cleanup of expired invitations
    },
    isPublicInvitation: {
      type: Boolean,
      default: false,
      index: true // Index for filtering public invitations
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound indexes for common queries
InvitationSchema.index({ invitedBy: 1, status: 1 }); // Find user's invitations by status
InvitationSchema.index({ token: 1, status: 1, expiresAt: 1 }); // Validate invitation tokens

// Ensure one pending invitation per email (prevent spam)
InvitationSchema.index({ email: 1, status: 1 }, { unique: true, partialFilterExpression: { status: InvitationStatus.PENDING } });

export default model<IInvitation>("Invitation", InvitationSchema);
