# 🚨 AWS SES Authentication Fix - Immediate Solution

## 🎯 **Problem Identified**
You're getting **"535 Authentication Credentials Invalid"** error when sending invitation emails. This means your AWS SES credentials are either:
- ❌ Invalid or expired
- ❌ Not properly configured in Elastic Beanstalk
- ❌ Missing required permissions

## 🛠️ **Immediate Fix Steps**

### **Step 1: Create New AWS SES Credentials**

1. **Go to AWS IAM Console:**
   - Log into [AWS Console](https://console.aws.amazon.com)
   - Navigate to **IAM** → **Users**
   - Find your existing user or create a new one named `ses-email-user`

2. **Generate New Access Keys:**
   - Select your user
   - Go to **Security credentials** tab
   - Click **"Create access key"**
   - Choose **"Application running outside AWS"**
   - **IMPORTANT**: Copy both **Access Key ID** and **Secret Access Key**

3. **Attach SES Permissions:**
   - Go to **Permissions** tab
   - Click **"Add permissions"**
   - Choose **"Attach existing policies directly"**
   - Search for **"AmazonSESFullAccess"** and attach it

### **Step 2: Verify Email in AWS SES**

1. **Go to AWS SES Console:**
   - Navigate to **Simple Email Service (SES)**
   - Make sure you're in **ap-south-1** region
   - Click **"Verified identities"**

2. **Verify Your Email:**
   - Click **"Create identity"**
   - Choose **"Email address"**
   - Enter your email (e.g., `noreply@tasksync.org`)
   - Click **"Create identity"**
   - Check your email and click the verification link

### **Step 3: Update Elastic Beanstalk Environment**

**Option A: Using PowerShell Script (Recommended)**

1. **Run the update script:**
   ```powershell
   cd P12-class-based-ts-CRUD
   .\scripts\update-eb-env.ps1 -EnvironmentName "your-env-name" -AccessKeyId "YOUR_NEW_ACCESS_KEY" -SecretAccessKey "YOUR_NEW_SECRET_KEY" -FromEmail "noreply@tasksync.org"
   ```

**Option B: Manual AWS Console Update**

1. **Go to Elastic Beanstalk Console:**
   - Navigate to your environment
   - Click **"Configuration"**
   - Under **"Software"**, click **"Edit"**

2. **Add Environment Variables:**
   ```
   AWS_SES_ACCESS_KEY_ID = your_new_access_key
   AWS_SES_SECRET_ACCESS_KEY = your_new_secret_key
   AWS_SES_REGION = ap-south-1
   AWS_SES_FROM_EMAIL = noreply@tasksync.org
   ```

3. **Remove Legacy SMTP Variables:**
   ```
   EMAIL_HOST = (leave empty)
   EMAIL_USER = (leave empty)
   EMAIL_PASS = (leave empty)
   ```

4. **Click "Apply"** and wait for deployment

### **Step 4: Test the Fix**

1. **Wait for deployment** (2-3 minutes)

2. **Test locally first:**
   ```bash
   cd P12-class-based-ts-CRUD
   node scripts/test-email-service.js
   ```

3. **Test the production endpoint:**
   ```bash
   curl -X POST https://your-app.elasticbeanstalk.com/api/notifications/email/test \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

4. **Check application logs:**
   ```bash
   eb logs
   ```
   Look for: `✅ Email service initialized successfully with ses`

## 🔍 **Troubleshooting**

### **If you still get authentication errors:**

1. **Check IAM Permissions:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

2. **Verify Email Address:**
   - Go to SES Console → Verified identities
   - Ensure your email shows as "Verified"

3. **Check Region:**
   - Ensure SES and your app are in the same region (ap-south-1)

4. **Restart Application:**
   - After changing environment variables, restart your EB environment

### **Common Error Messages:**

- **"535 Authentication Credentials Invalid"** → Wrong credentials
- **"Email address not verified"** → Verify email in SES Console
- **"Account still in sandbox mode"** → Request production access
- **"Invalid sender email"** → Use verified email address

## 📋 **Complete Environment Variables**

Make sure these are set in your Elastic Beanstalk environment:

```env
# AWS SES Configuration (REQUIRED)
AWS_SES_ACCESS_KEY_ID=your_new_access_key_here
AWS_SES_SECRET_ACCESS_KEY=your_new_secret_key_here
AWS_SES_REGION=ap-south-1
AWS_SES_FROM_EMAIL=noreply@tasksync.org

# Remove these to prevent fallback to SMTP
EMAIL_HOST=
EMAIL_USER=
EMAIL_PASS=

# Other required variables
PORT=3000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://www.tasksync.org
```

## 🧪 **Testing Commands**

### **1. Test Email Service Health:**
```bash
curl https://your-app.elasticbeanstalk.com/api/notifications/health
```

### **2. Test Email Sending:**
```bash
curl -X POST https://your-app.elasticbeanstalk.com/api/notifications/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### **3. Test Invitation Sending:**
```bash
curl -X POST https://your-app.elasticbeanstalk.com/api/invitations/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "invite@example.com",
    "role": "member"
  }'
```

## ✅ **Success Indicators**

After applying the fix, you should see:

1. **In application logs:**
   ```
   ✅ Email service initialized successfully with ses
   ✅ Test email sent to test@example.com via ses
   ```

2. **In health endpoint:**
   ```json
   {
     "data": {
       "services": {
         "email": {
           "enabled": true,
           "configured": true,
           "status": "ready",
           "provider": "ses"
         }
       }
     }
   }
   ```

3. **No more authentication errors** in your application logs

## 🚀 **Next Steps After Fix**

1. **Monitor email delivery** in AWS SES Console
2. **Request production access** to remove sandbox limitations
3. **Set up domain verification** for better deliverability
4. **Configure email templates** for professional appearance

## 📞 **If Still Having Issues**

1. **Check AWS SES Console** for any error messages
2. **Verify your AWS account** has SES enabled
3. **Contact AWS Support** if SES is not available in your region
4. **Consider alternative providers** (SendGrid, Mailgun) as backup

This fix will resolve your "535 Authentication Credentials Invalid" error and get your invitation emails working properly! 🎉 