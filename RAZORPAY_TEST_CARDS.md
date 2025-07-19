# Razorpay Test Cards Guide

## Valid Test Card Numbers for India

### Domestic Cards (Always Work)
```
Card Number: 4111111111111111
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
Name: Any name
```

### Other Valid Test Cards
```
# Visa
4111111111111111
4012888888881881

# Mastercard
5555555555554444
5105105105105100

# American Express
378282246310005
371449635398431
```

## Test UPI IDs
```
success@razorpay
failure@razorpay
```

## Test Bank Account Details
```
Account Number: 1111111111111
IFSC: RAZR0000001
```

## Important Notes:
1. **Always use test cards in test mode** - Never use real card details
2. **Use domestic Indian cards** - International cards may be blocked
3. **Check account settings** - Ensure international payments are enabled if needed
4. **Use proper test environment** - Make sure you're using test keys (rzp_test_*)

## Enable International Payments (If Needed):
1. Go to Razorpay Dashboard
2. Settings → Payment Methods
3. Enable "International" payments
4. Complete KYC if required

## Testing Payment Flow:
1. Use test card: `4111111111111111`
2. Any future expiry date
3. Any CVV
4. Payment should succeed with test cards
