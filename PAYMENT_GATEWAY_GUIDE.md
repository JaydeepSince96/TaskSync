# Payment Gateway Integration Guide - TaskSync

## Overview
This document describes the complete payment gateway integration using Razorpay for TaskSync's SaaS subscription model.

## Features Implemented

### 🎯 Subscription Plans
- **3-Day Free Trial**: Automatic for new users, no payment required
- **Monthly Plan**: ₹199/month - Full premium features
- **Quarterly Plan**: ₹299/3 months - Best value (Save ₹298!)

### 💳 Payment Methods Supported
- Credit/Debit Cards (Visa, MasterCard, RuPay)
- UPI (Google Pay, PhonePe, Paytm, etc.)
- Net Banking (All major banks)
- Digital Wallets (Paytm, Mobikwik, etc.)
- EMI Options (for amounts ≥ ₹1000)
- Pay Later Services

### 🔧 Backend Implementation

#### Models Created
1. **Subscription Model** (`src/models/subscription-model.ts`)
   - Comprehensive subscription tracking
   - Payment status management
   - Trial period handling
   - Auto-renewal settings

2. **Updated User Model** (`src/models/user-model.ts`)
   - Added subscription fields for quick access
   - Trial tracking information

#### Services Implemented
1. **Razorpay Service** (`src/services/razorpay-service.ts`)
   - Order creation and management
   - Payment verification
   - Subscription handling
   - Webhook processing

2. **Subscription Service** (`src/services/subscription-service.ts`)
   - Trial initialization
   - Subscription activation
   - Plan management
   - Access control

#### Controllers & Routes
1. **Payment Controller** (`src/controllers/payment-controller.ts`)
   - Plan management
   - Order creation
   - Payment verification
   - Subscription management

2. **Payment Routes** (`src/routes/payment-route.ts`)
   - RESTful API endpoints
   - Protected and public routes

#### Middleware
1. **Subscription Middleware** (`src/middleware/subscription-middleware.ts`)
   - Access control based on subscription status
   - Trial management
   - Usage limits enforcement

### 🎨 Frontend Implementation

#### Pages Created
1. **Payment Page** (`src/pages/PaymentPage.tsx`)
   - Plan selection UI
   - Razorpay integration
   - Payment processing

2. **Subscription Page** (`src/pages/SubscriptionPage.tsx`)
   - Subscription status display
   - Plan management
   - Cancellation handling

#### API Integration
1. **Payment API** (`src/api/payment/payment-api.ts`)
   - Complete API wrapper
   - Type-safe interfaces
   - Error handling

## API Endpoints

### Public Endpoints
```bash
GET  /api/payment/plans                    # Get available plans
GET  /api/payment/payment-methods          # Get payment methods
POST /api/payment/webhook                  # Razorpay webhook
```

### Protected Endpoints (Require Authentication)
```bash
GET  /api/payment/subscription/status      # Get subscription status
POST /api/payment/subscription/trial       # Initialize trial
POST /api/payment/subscription/order       # Create payment order
POST /api/payment/subscription/verify      # Verify payment
POST /api/payment/subscription/cancel      # Cancel subscription
GET  /api/payment/subscription/history     # Get subscription history
```

## Database Schema

### Subscriptions Collection
```javascript
{
  userId: ObjectId,           // User reference
  plan: String,              // 'trial', 'monthly', 'quarterly'
  status: String,            // 'active', 'expired', 'cancelled', 'trial'
  startDate: Date,
  endDate: Date,
  trialStartDate: Date,      // Optional
  trialEndDate: Date,        // Optional
  amount: Number,            // Plan amount
  currency: String,          // 'INR'
  razorpayOrderId: String,   // Razorpay order ID
  razorpayPaymentId: String, // Razorpay payment ID
  paymentStatus: String,     // 'pending', 'paid', 'failed'
  paymentDetails: {          // Payment method info
    method: String,
    bank: String,
    cardLast4: String,
    upiId: String
  },
  autoRenew: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Updated Users Collection
```javascript
{
  // ... existing fields
  subscriptionStatus: String,    // Quick access to status
  subscriptionPlan: String,      // Current plan
  subscriptionEndDate: Date,     // Quick access to end date
  trialEndDate: Date            // Trial end date
}
```

## Environment Configuration

Add to your `.env` file:
```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

## Setup Instructions

### 1. Backend Setup
```bash
# Install dependencies
cd "e:\SaaS\P12-class-based-ts-CRUD"
npm install razorpay

# Configure environment variables
cp .env.example .env
# Edit .env with your Razorpay credentials

# Start the server
npm run dev
```

### 2. Frontend Setup
```bash
# No additional packages needed
cd "e:\SaaS\React-Typescript-Practice"
npm run dev
```

### 3. Razorpay Setup
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get your API keys from Settings > API Keys
3. Set up webhooks at Settings > Webhooks
   - Webhook URL: `https://your-domain.com/api/payment/webhook`
   - Events: `payment.captured`, `payment.failed`, `subscription.activated`, `subscription.cancelled`

## User Journey

### New User Registration
1. User registers → Trial automatically initialized
2. User gets 3-day full access
3. Before trial expires → Shown upgrade options
4. After trial expires → Limited access until upgrade

### Payment Flow
1. User selects plan on Payment Page
2. Razorpay checkout opens with supported payment methods
3. User completes payment
4. Backend verifies payment signature
5. Subscription activated immediately
6. User redirected to dashboard with success message

### Subscription Management
1. Users can view subscription status on Subscription Page
2. Cancel subscription (access continues until end date)
3. Reactivate expired/cancelled subscriptions
4. View payment history

## Access Control

### Trial Users
- Full access to all features for 3 days
- Automatic trial initialization on registration
- Upgrade prompts as trial nears expiration

### Premium Users
- Unlimited access to all features
- No usage restrictions
- Priority support

### Expired Users
- Limited access to basic features
- Read-only mode for existing data
- Upgrade prompts throughout the app

## Security Features

### Payment Security
- PCI DSS compliant through Razorpay
- Secure payment signature verification
- Encrypted data transmission
- No sensitive payment data stored locally

### Access Control
- JWT token-based authentication
- Subscription status middleware
- Real-time access validation
- Automatic access revocation on expiry

## Testing

### Test Payment Flow
1. Use Razorpay test mode credentials
2. Test cards available in Razorpay documentation
3. Verify webhook delivery and processing
4. Test subscription lifecycle (activation, renewal, cancellation)

### Test Credentials (Razorpay Test Mode)
```bash
# Test Card Details
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3-digit number
Name: Any name

# Test UPI ID
upi@paytm
```

## Monitoring & Analytics

### Key Metrics to Track
- Trial conversion rate
- Monthly vs Quarterly plan adoption
- Payment success/failure rates
- Churn rate and cancellation reasons
- Revenue analytics

### Webhook Events to Monitor
- `payment.captured` - Successful payments
- `payment.failed` - Failed payment attempts
- `subscription.activated` - New subscriptions
- `subscription.cancelled` - Subscription cancellations

## Troubleshooting

### Common Issues
1. **Payment verification fails**
   - Check webhook signature verification
   - Ensure correct webhook secret
   - Verify Razorpay credentials

2. **Trial not initializing**
   - Check subscription service logs
   - Verify user model updates
   - Ensure database connectivity

3. **Access denied after payment**
   - Verify payment verification endpoint
   - Check subscription status updates
   - Review middleware configuration

### Debug Steps
1. Check server logs for errors
2. Verify Razorpay webhook delivery
3. Test API endpoints with Postman
4. Check database subscription records
5. Verify JWT token validity

## Future Enhancements

### Planned Features
- Annual subscription plan with bigger discount
- Team/Organization plans
- Usage-based pricing tiers
- Automatic plan upgrades based on usage
- Billing address management
- Invoice generation and download
- Referral program integration
- Multiple payment methods per user

### Technical Improvements
- Subscription analytics dashboard
- Automated email receipts
- Failed payment retry logic
- Proration handling for plan changes
- Multi-currency support
- Tax calculation integration

## Support

For technical support or questions:
1. Check the troubleshooting section above
2. Review Razorpay documentation
3. Test in Razorpay test mode first
4. Verify webhook configuration
5. Check server and database logs

## Deployment Checklist

### Before Going Live
- [ ] Switch from Razorpay test to live credentials
- [ ] Update webhook URLs to production
- [ ] Test complete payment flow in production
- [ ] Set up monitoring and alerts
- [ ] Verify SSL certificate on payment pages
- [ ] Test subscription lifecycle end-to-end
- [ ] Backup database before deployment
- [ ] Update CORS configuration for production domain
- [ ] Set up error logging and monitoring
- [ ] Configure automated backups for subscription data

### Post-Deployment
- [ ] Monitor payment success rates
- [ ] Track webhook delivery status
- [ ] Verify subscription activation flow
- [ ] Test cancellation and reactivation
- [ ] Monitor server performance under load
- [ ] Set up alerts for failed payments
- [ ] Review security logs regularly
- [ ] Monitor trial-to-paid conversion rates

This completes the comprehensive payment gateway integration for TaskSync!
