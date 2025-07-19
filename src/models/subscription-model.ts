// src/models/subscription-model.ts
import { Schema, model, Document } from "mongoose";

export enum SubscriptionPlan {
  TRIAL = "trial",
  MONTHLY = "monthly", 
  QUARTERLY = "quarterly"
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING = "pending",
  TRIAL = "trial"
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded"
}

export interface ISubscription extends Document {
  userId: Schema.Types.ObjectId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  trialStartDate?: Date;
  trialEndDate?: Date;
  amount: number;
  currency: string;
  razorpaySubscriptionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    method: string; // UPI, card, netbanking etc.
    bank?: string;
    cardLast4?: string;
    upiId?: string;
  };
  nextBillingDate?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isActive(): boolean;
  isTrialActive(): boolean;
  getRemainingDays(): number;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    plan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      required: true,
      default: SubscriptionPlan.TRIAL
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      required: true,
      default: SubscriptionStatus.TRIAL
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    trialStartDate: {
      type: Date
    },
    trialEndDate: {
      type: Date
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    currency: {
      type: String,
      required: true,
      default: "INR"
    },
    razorpaySubscriptionId: {
      type: String,
      sparse: true,
      index: true
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
      default: PaymentStatus.PENDING
    },
    paymentDetails: {
      method: String,
      bank: String,
      cardLast4: String,
      upiId: String
    },
    nextBillingDate: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ userId: 1, createdAt: -1 });
SubscriptionSchema.index({ endDate: 1, status: 1 }); // For finding expiring subscriptions
SubscriptionSchema.index({ nextBillingDate: 1, autoRenew: 1 }); // For billing automation

// Instance method to check if subscription is active
SubscriptionSchema.methods.isActive = function(): boolean {
  const now = new Date();
  return this.status === SubscriptionStatus.ACTIVE && this.endDate > now;
};

// Instance method to check if trial is active
SubscriptionSchema.methods.isTrialActive = function(): boolean {
  const now = new Date();
  return this.status === SubscriptionStatus.TRIAL && 
         this.trialEndDate && this.trialEndDate > now;
};

// Instance method to get remaining days
SubscriptionSchema.methods.getRemainingDays = function(): number {
  const now = new Date();
  const endDate = this.status === SubscriptionStatus.TRIAL ? this.trialEndDate : this.endDate;
  if (!endDate) return 0;
  
  const timeDiff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
};

// Static method to get plan pricing
SubscriptionSchema.statics.getPlanPricing = function() {
  return {
    [SubscriptionPlan.TRIAL]: { amount: 0, duration: 3, currency: "INR" },
    [SubscriptionPlan.MONTHLY]: { amount: 199, duration: 30, currency: "INR" },
    [SubscriptionPlan.QUARTERLY]: { amount: 299, duration: 90, currency: "INR" }
  };
};

export const Subscription = model<ISubscription>("Subscription", SubscriptionSchema);
export default Subscription;
