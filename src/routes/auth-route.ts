// src/routes/auth-route.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth-controller";
import { authenticateToken } from "../middleware/auth-middleware";
import { uploadProfilePicture, handleUploadError } from "../middleware/upload-middleware";
import passport from "../configs/passport";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../configs/env";
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  handleValidationErrors
} from "../middleware/validation-middleware";

const router = Router();

// Public routes
router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  AuthController.register
);

router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  AuthController.login
);

router.post("/refresh-token", AuthController.refreshToken);

// Google OAuth routes (only if credentials are configured)
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  router.get("/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  router.get("/google/callback",
    passport.authenticate("google", { 
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_failed`,
      session: false 
    }),
    AuthController.googleCallback
  );
} else {
  // Provide fallback route that returns an error
  router.get("/google", (req, res) => {
    res.status(503).json({
      success: false,
      message: "Google OAuth is not configured on this server"
    });
  });
}

// Protected routes
router.post("/logout", authenticateToken, AuthController.logout);
router.post("/logout-all", authenticateToken, AuthController.logoutAll);

router.get("/profile", authenticateToken, AuthController.getProfile);
router.put("/profile", authenticateToken, AuthController.updateProfile);

router.get("/preferences", authenticateToken, AuthController.getPreferences);
router.put("/preferences", authenticateToken, AuthController.updatePreferences);

router.post(
  "/upload-profile-picture",
  authenticateToken,
  uploadProfilePicture.single("profilePicture"),
  handleUploadError,
  AuthController.uploadProfilePicture
);

router.put(
  "/change-password",
  authenticateToken,
  changePasswordValidation,
  handleValidationErrors,
  AuthController.changePassword
);

router.delete("/account", authenticateToken, AuthController.deleteAccount);

export default router;
