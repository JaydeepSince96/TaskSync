// src/routes/invitation-route.ts
import { Router } from "express";
import { InvitationController } from "../controllers/invitation-controller";
import { InvitationService } from "../services/invitation-service";
import { EmailService } from "../services/email-service";
import { authenticateToken } from "../middleware/auth-middleware";

const invitationService = new InvitationService();
const emailService = new EmailService();
const invitationController = new InvitationController(invitationService, emailService);

const invitationRouter = Router();

// Apply authentication middleware to all routes
invitationRouter.use(authenticateToken);

// Send invitation to a user
invitationRouter.post("/send", invitationController.sendInvitation);

// Get all invitations sent by current user
invitationRouter.get("/my-invitations", invitationController.getMyInvitations);

// Get invited users for assignment suggestions
invitationRouter.get("/invited-users", invitationController.getInvitedUsers);

// Validate invitation token (this will be called during signup)
invitationRouter.get("/validate/:token", invitationController.validateInvitation);

// Resend invitation
invitationRouter.post("/resend/:id", invitationController.resendInvitation);

export { invitationRouter };
