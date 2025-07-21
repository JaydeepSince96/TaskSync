// src/routes/payment-route.ts
import { Router } from "express";
import { PaymentController } from "../controllers/payment-controller";
import { authenticateToken } from "../middleware/auth-middleware";
import { SubscriptionService } from "../services/subscription-service";

const subscriptionService = new SubscriptionService();
const paymentController = new PaymentController(subscriptionService);

const paymentRouter = Router();

// Public routes
paymentRouter.get('/plans', paymentController.getPlans);
paymentRouter.get('/payment-methods', paymentController.getPaymentMethods);
paymentRouter.post('/webhook', paymentController.handleWebhook); // Razorpay webhook

// Protected routes - require authentication
paymentRouter.use(authenticateToken); // Apply authentication to all routes below

// Subscription management
paymentRouter.get('/subscription/status', paymentController.getSubscriptionStatus);
paymentRouter.get('/subscription/trial-eligibility', paymentController.checkTrialEligibility);
paymentRouter.post('/subscription/trial', paymentController.initializeTrial);
paymentRouter.post('/subscription/order', paymentController.createOrder);
paymentRouter.post('/subscription/verify', paymentController.verifyPayment);
paymentRouter.post('/subscription/cancel', paymentController.cancelSubscription);
paymentRouter.get('/subscription/history', paymentController.getSubscriptionHistory);

export { paymentRouter };
