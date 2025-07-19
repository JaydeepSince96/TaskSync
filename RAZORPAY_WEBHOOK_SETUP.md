# Razorpay Webhook Setup Guide

## ⚠️ Important: Webhook is OPTIONAL for Testing

**You can test payments without setting up webhooks!** 

- ✅ **For basic payment testing**: Webhooks are NOT required
- ✅ **Payment verification**: Your app handles this via `payment.verify` API endpoint
- ✅ **Subscription activation**: Happens immediately after successful payment verification
- ⚠️ **Webhooks are recommended**: For production to handle edge cases and automatic updates

## How Payments Work Without Webhooks

1. **User initiates payment** → Razorpay checkout opens
2. **Payment completes** → Razorpay returns payment details to your frontend
3. **Frontend calls your API** → `/api/payment/subscription/verify` endpoint
4. **Your API verifies payment** → Directly with Razorpay using signature verification
5. **Subscription activated** → User gets immediate access

**This flow works perfectly without webhooks!**

## When Do You Need Webhooks?

Webhooks are useful for:
- 🔄 **Automatic retries**: When your verification API fails temporarily
- 📱 **Background updates**: User closes browser before verification completes
- 🔔 **Real-time notifications**: Instant updates for subscription changes
- 🛡️ **Backup verification**: Additional security layer
- 📊 **Analytics**: Track payment events for reporting

But for **testing and development**, you can skip webhooks entirely!

## Quick Test Without Webhooks

1. ✅ Use your existing Razorpay KEY_ID and KEY_SECRET
2. ✅ Start your backend server
3. ✅ Test payment flow - it will work perfectly
4. ✅ Payment verification happens via your API, not webhooks

## Webhook Configuration (Optional - For Production)

Based on your current setup, here's what you need to configure in Razorpay:

### 1. Webhook URL
For **local development**:
```
http://localhost:3001/api/payment/webhook
```

For **production** (replace with your actual domain):
```
https://yourdomain.com/api/payment/webhook
```

### 2. Active Events
In the Razorpay dashboard, select these events:

**Payment Events** (✅ Check these):
- ✅ `payment.authorized` - When payment is authorized
- ✅ `payment.captured` - When payment is captured
- ✅ `payment.failed` - When payment fails

**Subscription Events** (✅ Check these if using subscriptions):
- ✅ `subscription.activated` - When subscription becomes active
- ✅ `subscription.charged` - When subscription is charged
- ✅ `subscription.completed` - When subscription completes
- ✅ `subscription.expired` - When subscription expires
- ✅ `subscription.halted` - When subscription is halted
- ✅ `subscription.cancelled` - When subscription is cancelled

### 3. Alert Email
Use: `jaydeepiitd95@gmail.com` (as shown in your screenshot)

### 4. Secret Configuration
After creating the webhook in Razorpay dashboard, you'll get a webhook secret. Update your `.env` file:

```bash
RAZORPAY_WEBHOOK_SECRET=your-actual-webhook-secret-from-razorpay
```

**Note**: If you're not using webhooks, you can leave `RAZORPAY_WEBHOOK_SECRET` empty or comment it out.

## Testing Payments Right Now (No Webhook Needed)

### Step 1: Update Your .env File
```bash
# Required for payments
RAZORPAY_KEY_ID=rzp_test_ep5MhE2DpWyv8X
RAZORPAY_KEY_SECRET=UJItpRt6PxBiHR3ouoTjLPsX

# Optional for webhooks (can leave empty for testing)
RAZORPAY_WEBHOOK_SECRET=
```

### Step 2: Start Testing
1. ✅ Start your backend: `npm run dev`
2. ✅ Start your frontend: `npm run dev`
3. ✅ Go to payment page and test with Razorpay test cards
4. ✅ Payment verification happens automatically via your API

### Razorpay Test Cards (No Real Money)
- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`  
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Testing Webhooks Locally (OPTIONAL - Only for Production Setup)

### Option 1: Using ngrok (Recommended for testing)
1. Install ngrok: `npm install -g ngrok`
2. Start your backend server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Use the ngrok HTTPS URL in Razorpay: `https://abc123.ngrok.io/api/payment/webhook`

### Option 2: Using LocalTunnel
1. Install: `npm install -g localtunnel`
2. Start tunnel: `lt --port 3000 --subdomain tasksynctesting`
3. Use: `https://tasksynctesting.loca.lt/api/payment/webhook`

## Summary: What You Need Right Now

### For Testing (Minimum Required):
- ✅ `RAZORPAY_KEY_ID` (you have this)
- ✅ `RAZORPAY_KEY_SECRET` (you have this)  
- ✅ Your backend and frontend running

### For Production (Later):
- ✅ All of the above
- ✅ Webhook setup with `RAZORPAY_WEBHOOK_SECRET`
- ✅ Production domain for webhook URL

**You can start testing payments immediately with just your KEY_ID and KEY_SECRET!** 🚀

## What the Webhook Handles

Your webhook endpoint (`/api/payment/webhook`) currently handles:
- ✅ Signature verification for security
- ✅ Payment success notifications
- ✅ Payment failure notifications
- ✅ Subscription updates
- ✅ Automatic subscription status updates in database

## Security Features
- ✅ Webhook signature verification using HMAC-SHA256
- ✅ Request body validation
- ✅ Event type filtering
- ✅ Error handling and logging

## Next Steps
1. Create webhook in Razorpay dashboard with above URL
2. Copy the webhook secret to your `.env` file
3. Test with a payment to verify webhook is working
4. Check server logs to see webhook events being received

## Webhook Events Your System Handles
- `payment.authorized` → Updates payment status
- `payment.captured` → Confirms payment completion
- `payment.failed` → Handles payment failures
- `subscription.*` → Updates subscription status in database
