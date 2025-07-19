// src/services/subscription-service.ts
import { ISubscription, Subscription, SubscriptionPlan, SubscriptionStatus, PaymentStatus } from '../models/subscription-model';
import { IUser, User } from '../models/user-model';
import razorpayService from './razorpay-service';

// Define plan pricing interface
interface PlanPricing {
  amount: number;
  duration: number;
  currency: string;
}

interface PlanPricingMap {
  [SubscriptionPlan.TRIAL]: PlanPricing;
  [SubscriptionPlan.MONTHLY]: PlanPricing;
  [SubscriptionPlan.QUARTERLY]: PlanPricing;
}

class SubscriptionService {
  // Get plan pricing map
  getPlanPricing(): PlanPricingMap {
    return {
      [SubscriptionPlan.TRIAL]: { amount: 0, duration: 3, currency: "INR" },
      [SubscriptionPlan.MONTHLY]: { amount: 199, duration: 30, currency: "INR" },
      [SubscriptionPlan.QUARTERLY]: { amount: 299, duration: 90, currency: "INR" }
    };
  }
  // Initialize trial subscription for new user
  async initializeTrialSubscription(userId: string): Promise<{ success: boolean; message: string; data?: ISubscription }> {
    try {
      // Get user information first
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if this user has already used their free trial
      if (user.hasUsedFreeTrial) {
        return {
          success: false,
          message: 'Free trial has already been used for this account'
        };
      }

      // Check if any user with the same email has used a trial (prevent email abuse)
      const existingTrialUser = await User.findOne({ 
        email: user.email,
        hasUsedFreeTrial: true 
      });

      if (existingTrialUser && existingTrialUser.id !== userId) {
        return {
          success: false,
          message: 'Free trial has already been used with this email address'
        };
      }

      // Check if user already has an active subscription
      const existingSubscription = await Subscription.findOne({ 
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
      });

      if (existingSubscription) {
        return {
          success: false,
          message: 'User already has an active subscription'
        };
      }

      // Create 3-day trial subscription
      const trialStartDate = new Date();
      const trialEndDate = new Date(trialStartDate);
      trialEndDate.setDate(trialEndDate.getDate() + 3);

      const trialSubscription = new Subscription({
        userId,
        plan: SubscriptionPlan.TRIAL,
        status: SubscriptionStatus.TRIAL,
        startDate: trialStartDate,
        endDate: trialEndDate,
        trialStartDate,
        trialEndDate,
        amount: 0,
        currency: 'INR',
        paymentStatus: PaymentStatus.PAID, // Trial is considered "paid"
        autoRenew: false
      });

      await trialSubscription.save();

      // Update user subscription status and mark trial as used
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'trial',
        subscriptionPlan: 'trial',
        subscriptionEndDate: trialEndDate,
        trialEndDate: trialEndDate,
        hasUsedFreeTrial: true,
        trialUsedAt: trialStartDate
      });

      return {
        success: true,
        message: 'Trial subscription initialized successfully',
        data: trialSubscription
      };
    } catch (error: any) {
      console.error('Initialize trial subscription error:', error);
      return {
        success: false,
        message: error.message || 'Failed to initialize trial subscription'
      };
    }
  }

  // Check if user is eligible for free trial
  async isEligibleForTrial(userId: string): Promise<{ eligible: boolean; message: string }> {
    try {
      // Get user information
      const user = await User.findById(userId);
      if (!user) {
        return {
          eligible: false,
          message: 'User not found'
        };
      }

      // Check if this user has already used their free trial
      if (user.hasUsedFreeTrial) {
        return {
          eligible: false,
          message: 'Free trial has already been used for this account'
        };
      }

      // Check if any user with the same email has used a trial
      const existingTrialUser = await User.findOne({ 
        email: user.email,
        hasUsedFreeTrial: true 
      });

      if (existingTrialUser && existingTrialUser.id !== userId) {
        return {
          eligible: false,
          message: 'Free trial has already been used with this email address'
        };
      }

      // Check if user already has an active subscription
      const existingSubscription = await Subscription.findOne({ 
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
      });

      if (existingSubscription) {
        return {
          eligible: false,
          message: 'User already has an active subscription'
        };
      }

      return {
        eligible: true,
        message: 'User is eligible for free trial'
      };
    } catch (error: any) {
      console.error('Check trial eligibility error:', error);
      return {
        eligible: false,
        message: 'Error checking trial eligibility'
      };
    }
  }

  // Get user's current subscription
  async getCurrentSubscription(userId: string): Promise<{ success: boolean; data?: ISubscription; message?: string }> {
    try {
      const subscription = await Subscription.findOne({ 
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
      }).sort({ createdAt: -1 });

      return {
        success: true,
        data: subscription || undefined
      };
    } catch (error: any) {
      console.error('Get current subscription error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get subscription'
      };
    }
  }

  // Check if user has access to premium features
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await Subscription.findOne({ 
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
      });

      if (!subscription) return false;

      // Check if subscription is still valid
      const now = new Date();
      if (subscription.status === SubscriptionStatus.TRIAL) {
        return subscription.trialEndDate ? subscription.trialEndDate > now : false;
      }

      return subscription.endDate > now;
    } catch (error) {
      console.error('Check active subscription error:', error);
      return false;
    }
  }

  // Create payment order for subscription upgrade
  async createSubscriptionOrder(userId: string, planType: 'monthly' | 'quarterly'): Promise<{
    success: boolean;
    message: string;
    data?: {
      orderId: string;
      amount: number;
      currency: string;
      planDetails: any;
      razorpayKeyId: string;
    }
  }> {
    try {
      // Get plan pricing
      const planPricing = this.getPlanPricing();
      const plan = planType === 'monthly' ? SubscriptionPlan.MONTHLY : SubscriptionPlan.QUARTERLY;
      const pricing = planPricing[plan];

      if (!pricing) {
        return {
          success: false,
          message: 'Invalid subscription plan'
        };
      }

      // Create Razorpay order
      const orderResult = await razorpayService.createOrder(
        pricing.amount,
        pricing.currency,
        {
          userId: userId,
          planType: planType,
          purpose: 'subscription'
        }
      );

      if (!orderResult.success || !orderResult.data) {
        return {
          success: false,
          message: orderResult.message || 'Failed to create payment order'
        };
      }

      return {
        success: true,
        message: 'Payment order created successfully',
        data: {
          orderId: orderResult.data.id,
          amount: pricing.amount,
          currency: pricing.currency,
          planDetails: {
            plan: planType,
            duration: pricing.duration,
            amount: pricing.amount
          },
          razorpayKeyId: process.env.RAZORPAY_KEY_ID || ''
        }
      };
    } catch (error: any) {
      console.error('Create subscription order error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create subscription order'
      };
    }
  }

  // Verify payment and activate subscription
  async verifyPaymentAndActivateSubscription(
    userId: string,
    paymentData: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      planType: 'monthly' | 'quarterly';
    }
  ): Promise<{ success: boolean; message: string; data?: ISubscription }> {
    try {
      // Verify payment signature
      const isSignatureValid = razorpayService.verifyPaymentSignature(
        paymentData.razorpayOrderId,
        paymentData.razorpayPaymentId,
        paymentData.razorpaySignature
      );

      if (!isSignatureValid) {
        return {
          success: false,
          message: 'Invalid payment signature'
        };
      }

      // Get payment details from Razorpay
      const paymentDetailsResult = await razorpayService.getPaymentDetails(paymentData.razorpayPaymentId);
      
      if (!paymentDetailsResult.success) {
        return {
          success: false,
          message: 'Failed to verify payment details'
        };
      }

      const paymentDetails = paymentDetailsResult.data;

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      const planPricing = this.getPlanPricing();
      const plan = paymentData.planType === 'monthly' ? SubscriptionPlan.MONTHLY : SubscriptionPlan.QUARTERLY;
      const pricing = planPricing[plan];
      
      endDate.setDate(endDate.getDate() + pricing.duration);

      // Deactivate current subscription
      await Subscription.updateMany(
        { 
          userId,
          status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
        },
        { 
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date()
        }
      );

      // Create new active subscription
      const newSubscription = new Subscription({
        userId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        amount: pricing.amount,
        currency: pricing.currency,
        razorpayOrderId: paymentData.razorpayOrderId,
        razorpayPaymentId: paymentData.razorpayPaymentId,
        paymentStatus: PaymentStatus.PAID,
        paymentDetails: paymentDetails ? {
          method: paymentDetails.method,
          bank: paymentDetails.bank,
          cardLast4: paymentDetails.card ? paymentDetails.card.last4 : undefined,
          upiId: paymentDetails.vpa || undefined
        } : {
          method: 'unknown',
          bank: undefined,
          cardLast4: undefined,
          upiId: undefined
        },
        autoRenew: true,
        nextBillingDate: endDate
      });

      await newSubscription.save();

      // Update user subscription status
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'active',
        subscriptionPlan: paymentData.planType,
        subscriptionEndDate: endDate
      });

      return {
        success: true,
        message: 'Subscription activated successfully',
        data: newSubscription
      };
    } catch (error: any) {
      console.error('Verify payment and activate subscription error:', error);
      return {
        success: false,
        message: error.message || 'Failed to activate subscription'
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const subscription = await Subscription.findOne({ 
        userId,
        status: SubscriptionStatus.ACTIVE
      });

      if (!subscription) {
        return {
          success: false,
          message: 'No active subscription found'
        };
      }

      // Cancel Razorpay subscription if exists
      if (subscription.razorpaySubscriptionId) {
        await razorpayService.cancelSubscription(subscription.razorpaySubscriptionId, true);
      }

      // Update subscription status
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = reason;
      subscription.autoRenew = false;
      
      await subscription.save();

      // Update user status
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'cancelled'
      });

      return {
        success: true,
        message: 'Subscription cancelled successfully'
      };
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel subscription'
      };
    }
  }

  // Get subscription history
  async getSubscriptionHistory(userId: string): Promise<{ success: boolean; data?: ISubscription[]; message?: string }> {
    try {
      const subscriptions = await Subscription.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        success: true,
        data: subscriptions
      };
    } catch (error: any) {
      console.error('Get subscription history error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get subscription history'
      };
    }
  }

  // Check expiring subscriptions (for cron jobs)
  async getExpiringSubscriptions(days: number = 7): Promise<ISubscription[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const expiring = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $lte: futureDate, $gte: new Date() },
        autoRenew: false
      });

      return expiring;
    } catch (error) {
      console.error('Get expiring subscriptions error:', error);
      return [];
    }
  }

  // Expire old subscriptions (for cron jobs)
  async expireOldSubscriptions(): Promise<number> {
    try {
      const now = new Date();
      
      const result = await Subscription.updateMany(
        {
          status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
          endDate: { $lt: now }
        },
        {
          status: SubscriptionStatus.EXPIRED
        }
      );

      // Update user statuses
      const expiredSubscriptions = await Subscription.find({
        status: SubscriptionStatus.EXPIRED,
        endDate: { $lt: now }
      });

      for (const sub of expiredSubscriptions) {
        await User.findByIdAndUpdate(sub.userId, {
          subscriptionStatus: 'expired'
        });
      }

      return result.modifiedCount;
    } catch (error) {
      console.error('Expire old subscriptions error:', error);
      return 0;
    }
  }
}

export default new SubscriptionService();
