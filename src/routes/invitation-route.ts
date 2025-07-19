// src/routes/invitation-route.ts
import { Router } from "express";
import InvitationController from "../controllers/invitation-controller";
import { authenticateToken } from "../middleware/auth-middleware";

const invitationRouter = Router();

// Apply authentication middleware to all routes
invitationRouter.use(authenticateToken);

// Send invitation to a user
invitationRouter.post("/send", InvitationController.sendInvitation);

// Get all invitations sent by current user
invitationRouter.get("/my-invitations", InvitationController.getMyInvitations);

// Get invited users for assignment suggestions
invitationRouter.get("/invited-users", InvitationController.getInvitedUsers);

// Validate invitation token (this will be called during signup)
invitationRouter.get("/validate/:token", InvitationController.validateInvitation);

// Resend invitation
invitationRouter.post("/resend/:id", InvitationController.resendInvitation);

export default invitationRouter;
