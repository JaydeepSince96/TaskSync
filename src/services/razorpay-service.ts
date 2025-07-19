// src/services/razorpay-service.ts
import Razorpay from 'razorpay';

class RazorpayService {
  private razorpay: Razorpay | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      try {
        this.razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });
        this.isConfigured = true;
        console.log('Razorpay service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Razorpay service:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('Razorpay credentials not provided. Payment gateway will be disabled.');
      this.isConfigured = false;
    }
  }

  // Check if Razorpay is properly configured
  private checkConfiguration(): boolean {
    if (!this.isConfigured || !this.razorpay) {
      console.error('Razorpay service not configured. Please check your environment variables.');
      return false;
    }
    return true;
  }

  // Create order for one-time payment
  async createOrder(amount: number, currency: string = 'INR', notes: any = {}) {
    try {
      if (!this.checkConfiguration()) {
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      const order = await this.razorpay!.orders.create({
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        payment_capture: true,
        notes: notes
      });

      return {
        success: true,
        data: order
      };
    } catch (error: any) {
      console.error('Razorpay create order error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create Razorpay order'
      };
    }
  }

  // Verify payment signature
  verifyPaymentSignature(
    orderId: string, 
    paymentId: string, 
    signature: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(orderId + '|' + paymentId)
        .digest('hex');
      
      return generatedSignature === signature;
    } catch (error) {
      console.error('Payment signature verification error:', error);
      return false;
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId: string) {
    try {
      if (!this.checkConfiguration()) {
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      const payment = await this.razorpay!.payments.fetch(paymentId);
      return {
        success: true,
        data: payment
      };
    } catch (error: any) {
      console.error('Get payment details error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch payment details'
      };
    }
  }

  // Create subscription plan
  async createSubscriptionPlan(planId: string, amount: number, interval: 'daily' | 'weekly' | 'monthly' | 'yearly', intervalCount: number = 1) {
    try {
      if (!this.checkConfiguration()) {
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      const plan = await this.razorpay!.plans.create({
        item: {
          name: `TaskSync ${planId.toUpperCase()} Plan`,
          amount: amount * 100, // Amount in paise
          currency: 'INR'
        },
        period: interval, // 'monthly', 'quarterly', 'yearly'
        interval: intervalCount,
        notes: {
          plan_type: planId
        }
      });

      return {
        success: true,
        data: plan
      };
    } catch (error: any) {
      console.error('Create subscription plan error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create subscription plan'
      };
    }
  }

  // Create subscription
  async createSubscription(planId: string, totalCount: number, customerNotify: boolean = true) {
    try {
      if (!this.checkConfiguration()) {
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      const subscription = await this.razorpay!.subscriptions.create({
        plan_id: planId,
        total_count: totalCount,
        customer_notify: customerNotify ? 1 : 0,
        quantity: 1
      });

      return {
        success: true,
        data: subscription
      };
    } catch (error: any) {
      console.error('Create subscription error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create subscription'
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false) {
    try {
      if (!this.checkConfiguration()) {
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      const subscription = await this.razorpay!.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);

      return {
        success: true,
        data: subscription
      };
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel subscription'
      };
    }
  }

  // Get subscription details
  async getSubscriptionDetails(subscriptionId: string) {
    try {
      if (!this.checkConfiguration()) {
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      const subscription = await this.razorpay!.subscriptions.fetch(subscriptionId);
      return {
        success: true,
        data: subscription
      };
    } catch (error: any) {
      console.error('Get subscription details error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch subscription details'
      };
    }
  }

  // Create customer
  async createCustomer(name: string, email: string, contact?: string) {
    try {
      if (!this.checkConfiguration()) {
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      const customer = await this.razorpay!.customers.create({
        name: name,
        email: email,
        contact: contact,
        notes: {
          created_by: 'TaskSync'
        }
      });

      return {
        success: true,
        data: customer
      };
    } catch (error: any) {
      console.error('Create customer error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create customer'
      };
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number) {
    try {
      if (!this.checkConfiguration()) {
        return {
          success: false,
          message: 'Payment gateway not configured'
        };
      }

      const refundData: any = {
        payment_id: paymentId
      };
      
      if (amount) {
        refundData.amount = amount * 100; // Amount in paise
      }

      const refund = await this.razorpay!.payments.refund(paymentId, refundData);
      
      return {
        success: true,
        data: refund
      };
    } catch (error: any) {
      console.error('Refund payment error:', error);
      return {
        success: false,
        message: error.message || 'Failed to refund payment'
      };
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  // Get available payment methods for amount
  async getPaymentMethods(amount: number) {
    return {
      success: true,
      data: {
        card: true,
        netbanking: true,
        wallet: true,
        upi: true,
        emi: amount >= 1000, // EMI available for amounts >= ₹1000
        cardless_emi: amount >= 3000, // Cardless EMI for amounts >= ₹3000
        paylater: true
      }
    };
  }
}

export default new RazorpayService();
