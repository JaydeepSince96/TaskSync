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
  sendOTPValidation,
  verifyOTPValidation,
  resendOTPValidation,
  handleValidationErrors
} from "../middleware/validation-middleware";
import { AuthService } from "../services/auth-service";
import { InvitationService } from "../services/invitation-service";
import { SubscriptionService } from "../services/subscription-service";
import { OTPService } from "../services/otp-service";

const authService = new AuthService();
const invitationService = new InvitationService();
const subscriptionService = new SubscriptionService();
const otpService = new OTPService();
const authController = new AuthController(authService, invitationService, subscriptionService, otpService);

const authRouter = Router();

// Public routes - OTP-based registration
authRouter.post(
  "/send-otp",
  sendOTPValidation,
  handleValidationErrors,
  authController.sendRegistrationOTP
);

authRouter.post(
  "/verify-otp",
  verifyOTPValidation,
  handleValidationErrors,
  authController.verifyRegistrationOTP
);

authRouter.post(
  "/resend-otp",
  resendOTPValidation,
  handleValidationErrors,
  authController.resendRegistrationOTP
);

// Legacy registration route (for backward compatibility)
authRouter.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  authController.register
);

authRouter.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  authController.login
);

authRouter.post("/refresh-token", authController.refreshToken);

// Google OAuth routes (only if credentials are configured)
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  authRouter.get("/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  authRouter.get("/google/callback",
    passport.authenticate("google", { 
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_failed`,
      session: false 
    }),
    authController.googleCallback
  );
} else {
  // Provide fallback route that returns an error
  authRouter.get("/google", (req, res) => {
    res.status(503).json({
      success: false,
      message: "Google OAuth is not configured on this server"
    });
  });
}

// Protected routes
authRouter.post("/logout", authenticateToken, authController.logout);
authRouter.post("/logout-all", authenticateToken, authController.logoutAll);

authRouter.get("/profile", authenticateToken, authController.getProfile);
authRouter.put("/profile", authenticateToken, authController.updateProfile);

authRouter.get("/preferences", authenticateToken, authController.getPreferences);
authRouter.put("/preferences", authenticateToken, authController.updatePreferences);

authRouter.post(
  "/upload-profile-picture",
  authenticateToken,
  uploadProfilePicture.single("profilePicture"),
  handleUploadError,
  authController.uploadProfilePicture
);

authRouter.put(
  "/change-password",
  authenticateToken,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword
);

authRouter.delete("/account", authenticateToken, authController.deleteAccount);

export { authRouter };
