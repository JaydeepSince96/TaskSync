// src/middleware/subscription-middleware.ts
import { Request, Response, NextFunction } from 'express';
import subscriptionService from '../services/subscription-service';
import { getUserId } from '../utils/auth-types';

export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        subscriptionRequired: true
      });
      return;
    }

    const hasActiveSubscription = await subscriptionService.hasActiveSubscription(userId);

    if (!hasActiveSubscription) {
      const subscriptionResult = await subscriptionService.getCurrentSubscription(userId);
      const subscription = subscriptionResult.data;
      
      let message = 'Active subscription required';
      let subscriptionStatus = 'none';
      let remainingDays = 0;

      if (subscription) {
        remainingDays = subscription.getRemainingDays();
        
        if (subscription.status === 'trial' && remainingDays <= 0) {
          message = 'Your trial period has expired. Please upgrade to continue using premium features.';
          subscriptionStatus = 'trial_expired';
        } else if (subscription.status === 'expired') {
          message = 'Your subscription has expired. Please renew to continue using premium features.';
          subscriptionStatus = 'expired';
        } else if (subscription.status === 'cancelled') {
          message = 'Your subscription has been cancelled. Please subscribe again to continue.';
          subscriptionStatus = 'cancelled';
        }
      }

      res.status(403).json({
        success: false,
        message,
        subscriptionRequired: true,
        subscriptionStatus,
        remainingDays,
        upgrade: {
          available: true,
          plans: subscriptionService.getPlanPricing()
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      subscriptionRequired: true
    });
  }
};

export const requireTrialOrActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const hasActiveSubscription = await subscriptionService.hasActiveSubscription(userId);

    if (!hasActiveSubscription) {
      // Check if user has never had a subscription (eligible for trial)
      const subscriptionResult = await subscriptionService.getCurrentSubscription(userId);
      
      if (!subscriptionResult.data) {
        // No subscription found, initialize trial
        const trialResult = await subscriptionService.initializeTrialSubscription(userId);
        
        if (trialResult.success) {
          console.log(`Auto-initialized trial for user ${userId}`);
          next();
          return;
        }
      }

      // User has expired subscription or no active access
      res.status(403).json({
        success: false,
        message: 'Your trial has expired. Please upgrade to continue using TaskSync.',
        subscriptionRequired: true,
        upgrade: {
          available: true,
          plans: subscriptionService.getPlanPricing()
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Trial or active middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const checkSubscriptionLimits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const subscriptionResult = await subscriptionService.getCurrentSubscription(userId);
    const subscription = subscriptionResult.data;

    if (!subscription) {
      res.status(403).json({
        success: false,
        message: 'No subscription found. Please start your free trial.',
        subscriptionRequired: true
      });
      return;
    }

    // Different limits based on subscription type
    let taskLimit = 5; // Trial limit
    let subtaskLimit = 10;
    
    if (subscription.plan === 'monthly' || subscription.plan === 'quarterly') {
      taskLimit = 1000; // Unlimited for practical purposes
      subtaskLimit = 10000;
    }

    // Add limits to request for use in controllers
    (req as any).subscriptionLimits = {
      taskLimit,
      subtaskLimit,
      plan: subscription.plan,
      status: subscription.status
    };

    next();
  } catch (error) {
    console.error('Subscription limits middleware error:', error);
    next(); // Continue without limits check on error
  }
};
