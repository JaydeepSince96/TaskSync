// src/routes/payment-route.ts
import { Router } from "express";
import { PaymentController } from "../controllers/payment-controller";
import { authenticateToken } from "../middleware/auth-middleware";

const router = Router();

// Public routes
router.get('/plans', PaymentController.getPlans);
router.get('/payment-methods', PaymentController.getPaymentMethods);
router.post('/webhook', PaymentController.handleWebhook); // Razorpay webhook

// Protected routes - require authentication
router.use(authenticateToken); // Apply authentication to all routes below

// Subscription management
router.get('/subscription/status', PaymentController.getSubscriptionStatus);
router.get('/subscription/trial-eligibility', PaymentController.checkTrialEligibility);
router.post('/subscription/trial', PaymentController.initializeTrial);
router.post('/subscription/order', PaymentController.createOrder);
router.post('/subscription/verify', PaymentController.verifyPayment);
router.post('/subscription/cancel', PaymentController.cancelSubscription);
router.get('/subscription/history', PaymentController.getSubscriptionHistory);

export default router;
