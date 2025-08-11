# 🚨 CRITICAL FIX: Email Service & AWS SES Issues

## 📋 **Current Problems**
1. **AWS SES Production Access Denied** - You're stuck in sandbox mode
2. **Elastic Beanstalk 4xx Errors** - Email service configuration issues
3. **OTP Registration Failing** - Users can't register due to email problems

## 🔧 **IMMEDIATE FIX (Choose One Option)**

### **Option A: Use Gmail SMTP (Quick Fix - 10 minutes)**

**Step 1: Create Gmail App Password**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Factor Authentication
3. Go to "Security" → "App passwords"
4. Generate password for "Mail"
5. Copy the 16-character password

**Step 2: Update Environment Variables**
Go to **AWS Elastic Beanstalk Console** → Your Environment → **Configuration** → **Software** → **Environment Properties**

**REMOVE these variables:**
- `EMAIL_HOST`
- `EMAIL_PORT` 
- `EMAIL_SECURE`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM_NAME`
- `AWS_SES_ACCESS_KEY_ID`
- `AWS_SES_SECRET_ACCESS_KEY`
- `AWS_SES_REGION`
- `AWS_SES_FROM_EMAIL`

**ADD these variables:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM_NAME=TaskSync
```

**Step 3: Apply & Test**
1. Click "Apply" to restart your application
2. Test OTP registration immediately

### **Option B: Use SendGrid (Professional Solution)**

**Step 1: Sign up for SendGrid**
1. Go to [SendGrid.com](https://sendgrid.com/)
2. Create free account (100 emails/day)
3. Verify your email address
4. Create API Key

**Step 2: Update Environment Variables**
**REMOVE all email variables and ADD:**
```
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@domain.com
SENDGRID_FROM_NAME=TaskSync
```

### **Option C: Fix AWS SES Sandbox Mode**

**Step 1: Verify Email Addresses**
1. Go to AWS SES Console
2. Verify your sender email: `noreply@tasksync.org`
3. Verify test recipient emails

**Step 2: Request Production Access**
1. In SES Console, go to "Account dashboard"
2. Click "Request production access"
3. Fill out the form with:
   - Use case: "Transactional emails for user registration"
   - Email volume: "Less than 1000 emails per day"
   - Website: "https://tasksync.org"
   - Description: "Sending OTP verification emails for user registration"

## 🧪 **Testing After Fix**

```bash
# Test OTP endpoint
curl -X POST https://taskSync.ap-south-1.elasticbeanstalk.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-test-email@example.com",
    "password": "Test123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email. Please check your inbox and enter the 6-digit code.",
  "data": {
    "email": "your-test-email@example.com",
    "expiresIn": 15
  }
}
```

## 🔍 **Diagnostic Endpoints**

Test these endpoints to verify your setup:

```bash
# Health check
curl https://taskSync.ap-south-1.elasticbeanstalk.com/health

# Email service status
curl https://taskSync.ap-south-1.elasticbeanstalk.com/api/email-status

# CORS test
curl https://taskSync.ap-south-1.elasticbeanstalk.com/api/cors-test
```

## 🚀 **Recommended Action Plan**

1. **Immediate (Today)**: Use Gmail SMTP to get OTP working
2. **This Week**: Set up SendGrid for better deliverability
3. **Next Week**: Request AWS SES production access properly

## ⚠️ **Important Notes**

- **Gmail SMTP**: Limited to 500 emails/day, good for testing
- **SendGrid**: 100 emails/day free, better for production
- **AWS SES**: Best for high volume, but requires proper setup

## 📞 **If Still Having Issues**

1. Check Elastic Beanstalk logs for specific error messages
2. Verify all environment variables are correctly set
3. Ensure your domain CORS settings are correct
4. Test with a simple email first before OTP

**This should resolve both your email issues and Elastic Beanstalk health problems!**
