# 🚀 AWS SES Complete Setup Guide for TaskSync OTP

## 🚨 **Current Issue**
Your server is using invalid SMTP credentials, causing "535 Authentication Credentials Invalid" errors. You need to switch to AWS SES for reliable email delivery.

## 🎯 **Solution: Configure AWS SES**

### **Step 1: AWS SES Console Setup**

1. **Go to AWS SES Console**
   - Log into AWS Console
   - Navigate to **Simple Email Service (SES)**
   - **Important**: Make sure you're in the **ap-south-1** region (Mumbai)

2. **Verify Your Email/Domain**
   - Click **"Verified identities"**
   - Click **"Create identity"**
   
   **Option A - Email Verification (Quick):**
   - Choose **"Email address"**
   - Enter: `noreply@tasksync.org` (or your domain email)
   - Click **"Create identity"**
   - Check your email and click verification link
   
   **Option B - Domain Verification (Professional):**
   - Choose **"Domain"** 
   - Enter: `tasksync.org`
   - Follow DNS setup instructions

### **Step 2: Create IAM User for SES**

1. **Go to IAM Console**
   - Click **"Users"** → **"Create user"**
   - Username: `tasksync-ses-user`
   - Select **"Programmatic access"**

2. **Attach SES Permissions**
   - Click **"Attach existing policies directly"**
   - Search and select: **"AmazonSESFullAccess"**
   - Or create custom policy with minimal permissions:

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

3. **Get Credentials**
   - Complete user creation
   - **IMPORTANT**: Copy the **Access Key ID** and **Secret Access Key**
   - You won't see the secret key again!

### **Step 3: Configure Environment Variables**

**Replace your current email environment variables with these AWS SES variables:**

```env
# Remove these old SMTP variables
# EMAIL_HOST=
# EMAIL_PORT=
# EMAIL_SECURE=
# EMAIL_USER=
# EMAIL_PASS=

# Add these AWS SES variables
AWS_SES_ACCESS_KEY_ID=AKIA...your_access_key...
AWS_SES_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_SES_REGION=ap-south-1
AWS_SES_FROM_EMAIL=noreply@tasksync.org
```

### **Step 4: Apply to AWS Elastic Beanstalk**

1. **Go to your Elastic Beanstalk environment**
2. **Configuration → Software → Environment Properties**
3. **Remove old email variables:**
   - Delete `EMAIL_HOST`
   - Delete `EMAIL_PORT` 
   - Delete `EMAIL_SECURE`
   - Delete `EMAIL_USER`
   - Delete `EMAIL_PASS`
   - Delete `EMAIL_FROM_NAME`

4. **Add new AWS SES variables:**
   - `AWS_SES_ACCESS_KEY_ID` = Your access key
   - `AWS_SES_SECRET_ACCESS_KEY` = Your secret key
   - `AWS_SES_REGION` = `ap-south-1`
   - `AWS_SES_FROM_EMAIL` = `noreply@tasksync.org`

5. **Apply Configuration** (this will restart your app)

### **Step 5: SES Sandbox Mode (Important!)**

⚠️ **New AWS SES accounts start in "Sandbox Mode"**

**Sandbox Limitations:**
- Can only send to verified email addresses
- 200 emails per 24 hours
- 1 email per second

**To send to any email address:**
1. **Request Production Access**
   - Go to SES Console → Account dashboard
   - Click **"Request production access"**
   - Fill out the form explaining your use case:
     ```
     Use Case: Sending OTP verification emails for user registration
     Website: https://tasksync.org
     Email Type: Transactional (OTP verification)
     Expected Volume: 100-500 emails per day
     ```

**For Testing in Sandbox Mode:**
- Add test email addresses to verified identities
- Or use your verified domain email for testing

### **Step 6: Test the Configuration**

```bash
# Test with curl
curl -X POST https://api.tasksync.org/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-verified-email@example.com",
    "password": "Test123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email. Please check your inbox and enter the 6-digit code.",
  "data": {
    "email": "your-verified-email@example.com",
    "expiresIn": 15
  }
}
```

## 🔧 **Email Service Priority Order**

The EmailService will now use AWS SES because:
1. ❌ SendGrid - Not configured
2. ❌ Mailgun - Not configured  
3. ✅ **AWS SES - Configured** ← Will use this
4. ❌ SMTP - Removed (was causing auth errors)

## 📧 **SES Benefits for Your Use Case**

✅ **Free Tier**: 62,000 emails/month (perfect for OTP)
✅ **High Deliverability**: 99%+ inbox delivery
✅ **AWS Integration**: Same account, same billing
✅ **Scalable**: Handle thousands of OTPs per hour
✅ **Reliable**: Enterprise-grade infrastructure
✅ **Cost Effective**: $0.10 per 1,000 emails after free tier

## 🚨 **Troubleshooting**

### If SES Setup Fails:
1. **Check Region**: Must be `ap-south-1` (Mumbai)
2. **Verify Identity**: Email/domain must be verified
3. **IAM Permissions**: User needs SES send permissions
4. **Environment Variables**: All 4 SES variables required

### If Still Getting Auth Errors:
1. **Regenerate IAM credentials**
2. **Double-check access key and secret**
3. **Ensure no old SMTP variables remain**

## 🎉 **Expected Outcome**

After applying this configuration:
1. ✅ OTP registration will work perfectly
2. ✅ Professional emails from `noreply@tasksync.org`
3. ✅ No more authentication errors
4. ✅ Reliable email delivery
5. ✅ Ready for production scale

The email service will automatically detect AWS SES configuration and use it for all OTP emails!
