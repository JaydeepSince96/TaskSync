# Razorpay Account Configuration Steps

## Enable International Payments

1. **Login to Razorpay Dashboard**
   - Go to: https://dashboard.razorpay.com/

2. **Navigate to Settings**
   - Settings → Configuration → Payment Methods

3. **Enable International Payments**
   - Look for "International" section
   - Toggle ON "Accept International Payments"
   - Save changes

4. **Complete KYC if Required**
   - You might need to complete additional verification
   - Follow the prompts in dashboard

## Alternative: Test with Domestic Methods

If you can't enable international payments right now, use these:

### UPI Testing (Best Option)
- Test UPI ID: `success@razorpay`
- Test UPI ID: `failure@razorpay` (for testing failures)

### Net Banking Testing
- Select any bank from the list
- Choose "Success" on the test page

### Wallet Testing
- Most wallets have test options available

## Quick Test:
Try UPI first - it's the most reliable for testing in India and doesn't have international card restrictions.
