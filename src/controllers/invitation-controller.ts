// src/controllers/invitation-controller.ts
import { Request, Response, RequestHandler } from "express";
import { InvitationService } from "../services/invitation-service";
import { EmailService } from "../services/email-service";
import { getUserId } from "../utils/auth-types";
import { User } from "../models/user-model";
import { EmailValidationService } from '../services/email-validation-service';
import { SystemUserService } from '../services/system-user-service';
import Invitation from "../models/invitation-model";
import crypto from 'crypto';

// Initialize email validation service
const emailValidationService = new EmailValidationService();

export class InvitationController {
  constructor(private invitationService: InvitationService, private emailService: EmailService) {}

  // Send public invitation (no authentication required)
  sendPublicInvitation: RequestHandler = async (req, res) => {
    try {
      console.log("🔍 Public invitation request received:", req.body);
      const { email, inviterName, workspaceName } = req.body;

      if (!email || !email.trim()) {
        console.log("❌ Email validation failed: email is required");
        res.status(400).json({
          success: false,
          message: "Email is required"
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        console.log("❌ Email validation failed: invalid format");
        res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
        return;
      }

      console.log("✅ Email validation passed, checking existing user...");

      // Check if user is already registered
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingUser) {
        console.log("❌ User already registered:", email.trim());
        res.status(409).json({
          success: false,
          message: `User with email "${email.trim()}" is already registered`,
          code: "USER_ALREADY_REGISTERED"
        });
        return;
      }

      console.log("✅ User not registered, checking existing invitations...");

      // Check if there's already a pending invitation for this email (any pending invitation, regardless of expiry)
      const existingInvitation = await Invitation.findOne({ 
        email: email.trim().toLowerCase(), 
        status: 'pending'
      });

      if (existingInvitation) {
        console.log("❌ Invitation already pending:", email.trim());
        
        // Check if the existing invitation is expired
        if (existingInvitation.expiresAt < new Date()) {
          console.log("✅ Existing invitation is expired, updating status to expired");
          await Invitation.findByIdAndUpdate(existingInvitation._id, { status: 'expired' });
        } else {
          console.log("❌ Valid invitation already exists");
          res.status(409).json({
            success: false,
            message: `Invitation already sent to "${email.trim()}". Please wait for them to accept or for it to expire.`,
            code: "INVITATION_ALREADY_PENDING"
          });
          return;
        }
      }

      console.log("✅ No existing invitation, creating new invitation...");

      // Get system user for public invitations
      const systemUserId = await SystemUserService.getSystemUserId();
      console.log("✅ System user ID:", systemUserId);

      // Create new invitation for public access
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const invitation = new Invitation({
        email: email.trim().toLowerCase(),
        invitedBy: systemUserId, // Use system user for public invitations
        token,
        status: 'pending',
        expiresAt,
        isPublicInvitation: true
      });

      console.log("✅ Saving invitation to database...");
      await invitation.save();
      console.log("✅ Invitation saved successfully");

      console.log("✅ Sending invitation email...");
      
      // Debug environment variables
      console.log("🔍 Environment Variables Debug:");
      console.log("SENDGRID_API_KEY exists:", !!process.env.SENDGRID_API_KEY);
      console.log("SENDGRID_API_KEY length:", process.env.SENDGRID_API_KEY?.length || 0);
      console.log("SENDGRID_FROM_EMAIL:", process.env.SENDGRID_FROM_EMAIL || 'NOT SET');
      console.log("SENDGRID_FROM_NAME:", process.env.SENDGRID_FROM_NAME || 'NOT SET');
      console.log("FRONTEND_URL:", process.env.FRONTEND_URL || 'NOT SET');
      
      // Check if SendGrid is configured and try to send email
      if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== "") {
        console.log("✅ SendGrid configured, attempting to send email...");
        try {
          // Get system user for email
          const systemUser = await SystemUserService.getSystemUser();
          
          // Send invitation email using the email validation service
          const emailSent = await emailValidationService.sendInvitationEmail({
            toEmail: email.trim(),
            inviterName: inviterName || systemUser.name || 'TaskSync Team',
            invitationToken: token,
            workspaceName: workspaceName || 'TaskSync'
          });

          if (emailSent) {
            console.log("✅ Email sent successfully");
            console.log("✅ Invitation created successfully, returning success response");
            res.status(201).json({
              success: true,
              message: "Public invitation sent successfully",
              data: {
                id: invitation._id,
                email: invitation.email,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
                createdAt: invitation.createdAt
              }
            });
            return;
          } else {
            console.log("❌ Email sending failed, but keeping invitation");
          }
        } catch (emailError) {
          console.error("❌ Email sending error:", emailError);
          console.log("⚠️ Email failed, but keeping invitation in database");
        }
      } else {
        console.log("⚠️ SendGrid not configured, skipping email send");
      }

      // If email failed or not configured, still return success but with different message
      console.log("📧 Email would be sent to:", email.trim());
      console.log("🔗 Invitation URL:", `${process.env.FRONTEND_URL || 'https://tasksync.org'}/register?token=${token}&email=${encodeURIComponent(email.trim())}`);

      console.log("✅ Invitation created successfully (email may not have been sent)");
      res.status(201).json({
        success: true,
        message: "Public invitation created successfully",
        data: {
          id: invitation._id,
          email: invitation.email,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt
        }
      });
    } catch (error) {
      console.error("❌ Error sending public invitation:", error);
      
      // Handle MongoDB duplicate key error specifically
      if (error instanceof Error && error.message.includes('E11000 duplicate key error')) {
        console.log("❌ Duplicate invitation detected, checking for existing invitation...");
        
        // Try to find the existing invitation
        const existingInvitation = await Invitation.findOne({ 
          email: req.body.email?.trim().toLowerCase(), 
          status: 'pending'
        });
        
        if (existingInvitation) {
          console.log("✅ Found existing invitation, returning appropriate response");
          res.status(409).json({
            success: false,
            message: `Invitation already sent to "${req.body.email?.trim()}". Please wait for them to accept or for it to expire.`,
            code: "INVITATION_ALREADY_PENDING"
          });
          return;
        }
      }
      
      // Provide more detailed error information
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("❌ Error details:", {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      res.status(500).json({
        success: false,
        message: "Failed to send invitation",
        error: errorMessage
      });
    }
  };

  // Send invitation to a user (requires authentication)
  sendInvitation: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      const { email } = req.body;

      if (!email || !email.trim()) {
        res.status(400).json({
          success: false,
          message: "Email is required"
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
        return;
      }

      // Get inviter details
      const inviter = await User.findById(userId);
      if (!inviter) {
        res.status(404).json({
          success: false,
          message: "Inviter user not found"
        });
        return;
      }

      try {
        const { invitation } = await this.invitationService.sendInvitation(userId, email.trim());
        
        // Send invitation email
        await this.emailService.sendInvitationEmail(invitation, inviter.name);

        res.status(201).json({
          success: true,
          message: "Invitation sent successfully",
          data: {
            id: invitation._id,
            email: invitation.email,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt
          }
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("already registered")) {
            res.status(409).json({
              success: false,
              message: error.message,
              code: "USER_ALREADY_REGISTERED"
            });
            return;
          }
          
          if (error.message.includes("already sent")) {
            res.status(409).json({
              success: false,
              message: error.message,
              code: "INVITATION_ALREADY_PENDING"
            });
            return;
          }
        }
        
        throw error; // Re-throw other errors
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send invitation"
      });
    }
  };

  // Get all invitations sent by the current user
  getMyInvitations: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      const invitations = await this.invitationService.getInvitationsByUser(userId);

      res.status(200).json({
        success: true,
        data: invitations.map(invitation => ({
          id: invitation._id,
          email: invitation.email,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          updatedAt: invitation.updatedAt
        }))
      });
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch invitations"
      });
    }
  };

  // Get invited users for assignment suggestions
  getInvitedUsers: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      const invitedUsers = await this.invitationService.getInvitedUsers(userId);

      res.status(200).json({
        success: true,
        data: invitedUsers
      });
    } catch (error) {
      console.error("Error fetching invited users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch invited users"
      });
    }
  };

  // Validate invitation token (for signup process)
  validateInvitation: RequestHandler = async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          success: false,
          message: "Invitation token is required"
        });
        return;
      }

      const invitation = await this.invitationService.getInvitationByToken(token);

      if (!invitation) {
        res.status(404).json({
          success: false,
          message: "Invalid or expired invitation token"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Valid invitation token",
        data: {
          email: invitation.email,
          inviterName: (invitation.invitedBy as any)?.name || "Someone",
          expiresAt: invitation.expiresAt
        }
      });
    } catch (error) {
      console.error("Error validating invitation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to validate invitation"
      });
    }
  };

  // Resend invitation
  resendInvitation: RequestHandler = async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
        return;
      }

      const { id } = req.params;

      const invitation = await this.invitationService.resendInvitation(id, userId);

      if (!invitation) {
        res.status(404).json({
          success: false,
          message: "Invitation not found or cannot be resent"
        });
        return;
      }

      // Get inviter details
      const inviter = await User.findById(userId);
      if (inviter) {
        // Send invitation email again
        await this.emailService.sendInvitationEmail(invitation, inviter.name);
      }

      res.status(200).json({
        success: true,
        message: "Invitation resent successfully",
        data: {
          id: invitation._id,
          email: invitation.email,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          updatedAt: invitation.updatedAt
        }
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resend invitation"
      });
    }
  };

  // Debug endpoint to check environment variables
  debugEnvVars: RequestHandler = async (req, res) => {
    try {
      const envInfo = {
        sendGrid: {
          hasApiKey: !!process.env.SENDGRID_API_KEY,
          apiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
          fromEmail: process.env.SENDGRID_FROM_EMAIL || 'NOT SET',
          fromName: process.env.SENDGRID_FROM_NAME || 'NOT SET'
        },
        frontend: {
          url: process.env.FRONTEND_URL || 'NOT SET'
        },
        database: {
          hasMongoUri: !!process.env.MONGO_URI
        },
        jwt: {
          hasSecret: !!process.env.JWT_SECRET
        }
      };

      res.status(200).json({
        success: true,
        message: "Environment variables debug info",
        data: envInfo
      });
    } catch (error) {
      console.error("Error in debug endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get debug info"
      });
    }
  };
}

// Add new email validation endpoint
export const validateEmail: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
      return;
    }

    const validation = await emailValidationService.validateEmail(email);

    res.status(200).json({
      success: true,
      message: validation.isValid ? 'Email is valid' : 'Email is invalid',
      data: validation
    });
  } catch (error: any) {
    console.error('Email validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate email address',
      error: error.message
    });
  }
};

// Update the send invitation function to use email validation
export const sendInvitation: RequestHandler = async (req, res) => {
  try {
    const { email, workspaceName } = req.body;
    const userId = (req.user as any)?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
      return;
    }

    // Validate email first
    const emailValidation = await emailValidationService.validateEmail(email);
    if (!emailValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid email address',
        data: {
          reason: emailValidation.reason,
          score: emailValidation.score
        }
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Check if invitation already exists and is not expired
    const existingInvitation = await Invitation.findOne({
      email,
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      res.status(400).json({
        success: false,
        message: 'Invitation already sent to this email address'
      });
      return;
    }

    // Get inviter details
    const inviter = await User.findById(userId);
    if (!inviter) {
      res.status(404).json({
        success: false,
        message: 'Inviter not found'
      });
      return;
    }

    // Create invitation
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitation = new Invitation({
      email,
      invitedBy: userId,
      token: invitationToken,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
      status: 'pending'
    });

    await invitation.save();

    // Send invitation email using the new service
    const emailSent = await emailValidationService.sendInvitationEmail({
      toEmail: email,
      inviterName: inviter.name || inviter.email,
      invitationToken,
      workspaceName: workspaceName || 'TaskSync'
    });

    if (!emailSent) {
      // Delete the invitation if email failed
      await Invitation.findByIdAndDelete(invitation._id);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation email'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        email,
        expiresAt: invitation.expiresAt,
        workspaceName: workspaceName || 'TaskSync'
      }
    });

  } catch (error: any) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation',
      error: error.message
    });
  }
};
