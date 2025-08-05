# 🚀 AWS SES Setup Guide - Fix Email Authentication Issues

## 🎯 **Current Problem**
Your application is getting "535 Authentication Credentials Invalid" errors because:
- SMTP credentials are invalid/expired
- Using legacy SMTP instead of professional email service
- Not leveraging AWS SES (which is free and integrated with your AWS hosting)

## 📋 **Step-by-Step AWS SES Setup**

### **Step 1: Access AWS SES Console**
1. Log into your AWS Console
2. Go to **Simple Email Service (SES)**
3. Make sure you're in the **ap-south-1** region (Mumbai)

### **Step 2: Verify Your Email Address**
1. Click **"Verified identities"**
2. Click **"Create identity"**
3. Choose **"Email address"**
4. Enter your email: `your-email@example.com`
5. Click **"Create identity"**
6. Check your email and click the verification link

### **Step 3: Create IAM User for SES**
1. Go to **IAM Console**
2. Click **"Users"** → **"Create user"**
3. Name: `ses-email-user`
4. Select **"Programmatic access"**
5. Click **"Next: Permissions"**
6. Click **"Attach existing policies directly"**
7. Search for **"AmazonSESFullAccess"** and select it
8. Click **"Next: Tags"** → **"Next: Review"** → **"Create user"**
9. **IMPORTANT**: Copy the **Access Key ID** and **Secret Access Key**

### **Step 4: Update Environment Variables**
Add these to your AWS Elastic Beanstalk environment variables:

```env
AWS_SES_ACCESS_KEY_ID=your_access_key_here
AWS_SES_SECRET_ACCESS_KEY=your_secret_key_here
AWS_SES_REGION=ap-south-1
AWS_SES_FROM_EMAIL=your-verified-email@example.com
```

### **Step 5: Remove Legacy SMTP Variables**
Remove or comment out these variables to prevent fallback to SMTP:
```env
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
```

## 🔧 **AWS Elastic Beanstalk Configuration**

### **Method 1: Environment Variables (Recommended)**
1. Go to your Elastic Beanstalk environment
2. Click **"Configuration"**
3. Under **"Software"**, click **"Edit"**
4. Add these environment variables:
   - `AWS_SES_ACCESS_KEY_ID` = your_access_key
   - `AWS_SES_SECRET_ACCESS_KEY` = your_secret_key
   - `AWS_SES_REGION` = ap-south-1
   - `AWS_SES_FROM_EMAIL` = your_verified_email
5. Click **"Apply"**

### **Method 2: .ebextensions Configuration**
Create file: `.ebextensions/01-environment.config`
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    AWS_SES_ACCESS_KEY_ID: your_access_key_here
    AWS_SES_SECRET_ACCESS_KEY: your_secret_key_here
    AWS_SES_REGION: ap-south-1
    AWS_SES_FROM_EMAIL: your_verified_email@example.com
```

## 🧪 **Testing the Setup**

### **1. Deploy and Check Logs**
After updating environment variables, deploy your application and check the logs for:
```
✅ Email service initialized successfully with ses
```

### **2. Test Email Endpoint**
```bash
curl -X POST https://your-app.elasticbeanstalk.com/api/notifications/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### **3. Check Health Endpoint**
```bash
curl https://your-app.elasticbeanstalk.com/api/notifications/health
```

## 🚨 **Troubleshooting**

### **If you still get authentication errors:**
1. **Check IAM permissions**: Ensure the user has `ses:SendEmail` and `ses:SendRawEmail` permissions
2. **Verify email**: Make sure your email is verified in SES
3. **Check region**: Ensure SES and your app are in the same region
4. **Restart application**: After changing environment variables, restart your EB environment

### **If emails go to spam:**
1. **Verify domain** instead of just email address
2. **Set up SPF/DKIM records**
3. **Request production access** from AWS (removes sandbox limitations)

## 💰 **Cost Benefits**
- **62,000 emails/month FREE**
- **$0.10 per 1,000 emails** after free tier
- **No rate limits** like Gmail
- **99.9%+ deliverability**

## 🔄 **Migration from SMTP**
Once AWS SES is working:
1. Remove all SMTP-related environment variables
2. Update your email service to prioritize SES
3. Test all email functionality (invitations, reminders, etc.)
4. Monitor AWS SES console for delivery statistics

## 📞 **Next Steps**
1. Follow the setup guide above
2. Deploy with new environment variables
3. Test email functionality
4. Monitor logs for successful email sending
5. Remove legacy SMTP configuration

This will completely resolve your "535 Authentication Credentials Invalid" errors and give you a professional, scalable email solution. 