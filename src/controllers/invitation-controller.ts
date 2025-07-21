// src/controllers/invitation-controller.ts
import { Request, Response, RequestHandler } from "express";
import { InvitationService } from "../services/invitation-service";
import { EmailService } from "../services/email-service";
import { getUserId } from "../utils/auth-types";
import { User } from "../models/user-model";

export class InvitationController {
  constructor(private invitationService: InvitationService, private emailService: EmailService) {}

  // Send invitation to a user
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
}
