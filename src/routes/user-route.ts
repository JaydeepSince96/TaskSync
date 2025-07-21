// src/routes/user-route.ts
import { Router } from "express";
import { UserController } from "../controllers/user-controller";
import { InvitationService } from "../services/invitation-service";
import { authenticateToken } from "../middleware/auth-middleware";

const invitationService = new InvitationService();
const userController = new UserController(invitationService);

const userRouter = Router();

// Apply authentication middleware to all routes
userRouter.use(authenticateToken);

// Get all available users for assignment
userRouter.get("/available", userController.getAvailableUsers);

// Search users for autocomplete
userRouter.get("/search", userController.searchUsers);

// Register FCM device token for push notifications
userRouter.post("/register-device-token", userController.registerDeviceToken);

export { userRouter };
