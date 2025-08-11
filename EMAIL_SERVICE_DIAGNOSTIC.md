# 📧 Email Service Diagnostic Guide

## 🚨 **Current Issue**
Users are getting "Failed to send verification email" error during OTP registration because the email service is not properly configured.

## 🔍 **Diagnosis**

The email service tries multiple providers in this priority order:
1. **SendGrid** (requires `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL`)
2. **Mailgun** (requires `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` + `MAILGUN_FROM_EMAIL`)
3. **AWS SES** (requires `AWS_SES_ACCESS_KEY_ID` + `AWS_SES_SECRET_ACCESS_KEY` + `AWS_SES_FROM_EMAIL`)
4. **SMTP** (requires `EMAIL_USER` + `EMAIL_PASS`)

If none are configured, the service initializes with `isInitialized = false`.

## 🛠 **Solution Options**

### **Option 1: Quick Fix - Use Gmail SMTP (for testing)**

Add these environment variables to your production server:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=TaskSync
```

**Steps to get Gmail App Password:**
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Use that password (not your regular password)

### **Option 2: Professional Solution - AWS SES (Recommended)**

Since you're already on AWS, use SES:

```env
AWS_SES_ACCESS_KEY_ID=your_access_key
AWS_SES_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_REGION=ap-south-1
AWS_SES_FROM_EMAIL=noreply@tasksync.org
```

**Steps:**
1. Go to AWS SES Console
2. Verify your domain or email address
3. Create IAM user with SES permissions
4. Add credentials to environment variables

### **Option 3: SendGrid (Easy Setup)**

```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@tasksync.org
SENDGRID_FROM_NAME=TaskSync
```

**Steps:**
1. Sign up at SendGrid.com (100 emails/day free)
2. Create API Key
3. Add to environment variables

## 🔧 **How to Apply the Fix**

### **For AWS Elastic Beanstalk:**

1. Go to your Elastic Beanstalk environment
2. Configuration → Software → Environment Properties
3. Add the email service variables
4. Deploy/restart your application

### **For Local Development:**

1. Create/update `.env` file in your backend root
2. Add the chosen email provider variables
3. Restart your development server

## 🧪 **Testing the Fix**

After adding email configuration:

```bash
# Test the OTP endpoint
curl -X POST https://api.tasksync.org/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@example.com",
    "password": "Test123456"
  }'
```

You should get:
```json
{
  "success": true,
  "message": "Verification code sent to your email. Please check your inbox and enter the 6-digit code.",
  "data": {
    "email": "your-email@example.com",
    "expiresIn": 15
  }
}
```

## 📝 **Updated Error Messages**

I've improved the error messages to be more helpful:
- Email service not configured: Clear message to contact administrator
- Email sending failed: More specific guidance

## 🚀 **Quick Resolution**

**For immediate testing**, add Gmail SMTP credentials to your environment variables and restart the server. This will get OTP registration working right away.

**For production**, set up AWS SES or SendGrid for better deliverability and scalability.
