// src/controllers/payment-controller.ts
import { Request, Response } from "express";
import subscriptionService from "../services/subscription-service";
import { getUserId } from "../utils/auth-types";

export class PaymentController {
  // Get available subscription plans
  static async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = subscriptionService.getPlanPricing();
      
      res.status(200).json({
        success: true,
        message: "Subscription plans retrieved successfully",
        data: { plans }
      });
    } catch (error: any) {
      console.error("Get plans error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Get current subscription status
  static async getSubscriptionStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const subscriptionResult = await subscriptionService.getCurrentSubscription(userId);
      const hasActiveSubscription = await subscriptionService.hasActiveSubscription(userId);

      if (subscriptionResult.success) {
        const subscription = subscriptionResult.data;
        let remainingDays = 0;
        
        if (subscription) {
          remainingDays = subscription.getRemainingDays();
        }

        res.status(200).json({
          success: true,
          message: "Subscription status retrieved successfully",
          data: {
            subscription,
            hasActiveAccess: hasActiveSubscription,
            remainingDays,
            isTrialActive: subscription?.isTrialActive() || false,
            isActive: subscription?.isActive() || false
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: subscriptionResult.message || "Failed to get subscription status"
        });
      }
    } catch (error: any) {
      console.error("Get subscription status error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Check trial eligibility
  static async checkTrialEligibility(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const result = await subscriptionService.isEligibleForTrial(userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { 
          eligible: result.eligible,
          canActivateTrial: result.eligible
        }
      });
    } catch (error: any) {
      console.error("Check trial eligibility error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Initialize trial subscription
  static async initializeTrial(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const result = await subscriptionService.initializeTrialSubscription(userId);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Initialize trial error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Create payment order
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { planType } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      if (!planType || !['monthly', 'quarterly'].includes(planType)) {
        res.status(400).json({
          success: false,
          message: "Valid plan type is required (monthly or quarterly)"
        });
        return;
      }

      const result = await subscriptionService.createSubscriptionOrder(userId, planType);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Create order error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Verify payment and activate subscription
  static async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { 
        razorpayOrderId, 
        razorpayPaymentId, 
        razorpaySignature,
        planType 
      } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !planType) {
        res.status(400).json({
          success: false,
          message: "All payment details are required"
        });
        return;
      }

      const result = await subscriptionService.verifyPaymentAndActivateSubscription(userId, {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        planType
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Verify payment error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Cancel subscription
  static async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);
      const { reason } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const result = await subscriptionService.cancelSubscription(userId, reason);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Get subscription history
  static async getSubscriptionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const result = await subscriptionService.getSubscriptionHistory(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Get subscription history error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Get payment methods available for user
  static async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const { amount } = req.query;
      const paymentAmount = amount ? parseInt(amount as string) : 199;

      const methods = {
        card: {
          enabled: true,
          description: "Credit/Debit Cards",
          icon: "💳"
        },
        netbanking: {
          enabled: true,
          description: "Net Banking",
          icon: "🏦"
        },
        upi: {
          enabled: true,
          description: "UPI (Google Pay, PhonePe, Paytm)",
          icon: "📱"
        },
        wallet: {
          enabled: true,
          description: "Wallets (Paytm, Mobikwik, etc.)",
          icon: "👛"
        },
        emi: {
          enabled: paymentAmount >= 1000,
          description: "EMI Options",
          icon: "📊",
          minAmount: 1000
        },
        paylater: {
          enabled: true,
          description: "Pay Later Options",
          icon: "⏰"
        }
      };

      res.status(200).json({
        success: true,
        message: "Payment methods retrieved successfully",
        data: { methods, amount: paymentAmount }
      });
    } catch (error: any) {
      console.error("Get payment methods error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Handle Razorpay webhook (for subscription events)
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        res.status(400).json({
          success: false,
          message: "Webhook secret not configured"
        });
        return;
      }

      const signature = req.headers['x-razorpay-signature'] as string;
      const body = JSON.stringify(req.body);

      // Verify webhook signature
      const razorpayService = require('../services/razorpay-service').default;
      const isValidSignature = razorpayService.verifyWebhookSignature(body, signature, webhookSecret);

      if (!isValidSignature) {
        res.status(400).json({
          success: false,
          message: "Invalid webhook signature"
        });
        return;
      }

      const event = req.body;

      // Handle different webhook events
      switch (event.event) {
        case 'payment.captured':
          console.log('Payment captured:', event.payload.payment.entity);
          break;
        case 'payment.failed':
          console.log('Payment failed:', event.payload.payment.entity);
          break;
        case 'subscription.activated':
          console.log('Subscription activated:', event.payload.subscription.entity);
          break;
        case 'subscription.cancelled':
          console.log('Subscription cancelled:', event.payload.subscription.entity);
          break;
        default:
          console.log('Unhandled webhook event:', event.event);
      }

      res.status(200).json({
        success: true,
        message: "Webhook processed successfully"
      });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
}
