// src/services/invitation-service.ts
import Invitation, { IInvitation, InvitationStatus } from "../models/invitation-model";
import { User } from "../models/user-model";
import crypto from "crypto";

export class InvitationService {
  // Generate unique invitation token
  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send invitation to a user
  async sendInvitation(inviterUserId: string, email: string): Promise<{ invitation: IInvitation; alreadyRegistered: boolean }> {
    const trimmedEmail = email.trim().toLowerCase();

    // Check if user is already registered
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      throw new Error(`User with email "${trimmedEmail}" is already registered`);
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await Invitation.findOne({ 
      email: trimmedEmail, 
      status: InvitationStatus.PENDING,
      expiresAt: { $gt: new Date() } 
    });

    if (existingInvitation) {
      throw new Error(`Invitation already sent to "${trimmedEmail}". Please wait for them to accept or for it to expire.`);
    }

    // Create new invitation
    const token = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invitation = new Invitation({
      email: trimmedEmail,
      invitedBy: inviterUserId,
      token,
      status: InvitationStatus.PENDING,
      expiresAt
    });

    await invitation.save();
    
    // Populate the invitedBy field with user details
    await invitation.populate('invitedBy', 'name email');

    return { invitation, alreadyRegistered: false };
  }

  // Get invitation by token (for signup validation)
  async getInvitationByToken(token: string): Promise<IInvitation | null> {
    const invitation = await Invitation.findOne({ 
      token, 
      status: InvitationStatus.PENDING,
      expiresAt: { $gt: new Date() } 
    }).populate('invitedBy', 'name email');

    return invitation;
  }

  // Validate invitation token and email match (for signup validation)
  async validateInvitationToken(token: string, email: string): Promise<IInvitation | null> {
    const invitation = await Invitation.findOne({ 
      token, 
      email: email.trim().toLowerCase(),
      status: InvitationStatus.PENDING,
      expiresAt: { $gt: new Date() } 
    }).populate('invitedBy', 'name email');

    return invitation;
  }

  // Mark invitation as accepted
  async acceptInvitation(invitationId: string): Promise<IInvitation | null> {
    const invitation = await Invitation.findOneAndUpdate(
      { 
        _id: invitationId, 
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() } 
      },
      { status: InvitationStatus.ACCEPTED },
      { new: true }
    ).populate('invitedBy', 'name email');

    return invitation;
  }

  // Mark invitation as accepted by token (alternative method)
  async acceptInvitationByToken(token: string): Promise<IInvitation | null> {
    const invitation = await Invitation.findOneAndUpdate(
      { 
        token, 
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() } 
      },
      { status: InvitationStatus.ACCEPTED },
      { new: true }
    ).populate('invitedBy', 'name email');

    return invitation;
  }

  // Get all invitations sent by a user
  async getInvitationsByUser(userId: string): Promise<IInvitation[]> {
    return await Invitation.find({ invitedBy: userId })
      .sort({ createdAt: -1 })
      .populate('invitedBy', 'name email');
  }

  // Get invited users for assignment suggestions (only pending/accepted invitations)
  async getInvitedUsers(userId: string): Promise<Array<{email: string; name: string; status: InvitationStatus; isRegistered: boolean}>> {
    // Get all invitations sent by this user that are not expired
    const invitations = await Invitation.find({ 
      invitedBy: userId,
      status: { $in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] },
      expiresAt: { $gt: new Date() }
    });

    const invitedUsers = [];

    for (const invitation of invitations) {
      // Check if the invited user has registered
      const registeredUser = await User.findOne({ email: invitation.email });
      
      if (registeredUser) {
        // User has registered
        invitedUsers.push({
          email: invitation.email,
          name: registeredUser.name,
          status: InvitationStatus.ACCEPTED,
          isRegistered: true,
          _id: registeredUser._id,
          profilePicture: registeredUser.profilePicture
        });
      } else if (invitation.status === InvitationStatus.PENDING) {
        // User hasn't registered yet, but invitation is pending
        invitedUsers.push({
          email: invitation.email,
          name: invitation.email.split('@')[0], // Use email prefix as temporary name
          status: InvitationStatus.PENDING,
          isRegistered: false
        });
      }
    }

    return invitedUsers;
  }

  // Clean up expired invitations (can be called periodically)
  async cleanupExpiredInvitations(): Promise<number> {
    const result = await Invitation.updateMany(
      { 
        status: InvitationStatus.PENDING,
        expiresAt: { $lt: new Date() }
      },
      { status: InvitationStatus.EXPIRED }
    );

    return result.modifiedCount;
  }

  // Resend invitation (updates expiry date)
  async resendInvitation(invitationId: string, userId: string): Promise<IInvitation | null> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Extends for another 7 days

    const invitation = await Invitation.findOneAndUpdate(
      { _id: invitationId, invitedBy: userId, status: InvitationStatus.PENDING },
      { expiresAt, updatedAt: new Date() },
      { new: true }
    ).populate('invitedBy', 'name email');

    return invitation;
  }
}
