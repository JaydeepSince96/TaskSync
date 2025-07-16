// src/routes/user-route.ts
import { Router } from "express";
import UserController from "../controllers/user-controller";
import { authenticateToken } from "../middleware/auth-middleware";

const userRouter = Router();

// Apply authentication middleware to all routes
userRouter.use(authenticateToken);

// Get all available users for assignment
userRouter.get("/available", UserController.getAvailableUsers);

// Search users for autocomplete
userRouter.get("/search", UserController.searchUsers);

export default userRouter;
