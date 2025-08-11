# 🚀 SendGrid Setup Guide - Replace AWS SES

## 🎯 **Why SendGrid is Perfect for Your Use Cases**

✅ **No Sandbox Restrictions** - Can send to any email address  
✅ **Email Validation API** - Built-in email validation  
✅ **Free Tier** - 100 emails/day (perfect for testing)  
✅ **Professional Templates** - Beautiful email templates  
✅ **Easy Setup** - Simple API integration  
✅ **Better Deliverability** - Professional email service  

## 📋 **Your Requirements Solved**

1. **Email Validation** ✅ - Check if email is valid/disposable
2. **User Invitations** ✅ - Send invites to any email address
3. **OTP Registration** ✅ - Send verification codes
4. **No Restrictions** ✅ - No sandbox mode limitations

## 🔧 **Step-by-Step Setup**

### **Step 1: Create SendGrid Account**

1. Go to [SendGrid.com](https://sendgrid.com/)
2. Click "Start for Free"
3. Fill in your details:
   - **Email**: Your business email
   - **Password**: Strong password
   - **Company**: TaskSync
   - **Website**: https://tasksync.org
4. Choose **Free Plan** (100 emails/day)
5. Verify your email address

### **Step 2: Verify Your Sender Identity**

1. In SendGrid Dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Name**: TaskSync
   - **From Email**: noreply@tasksync.org (or your verified email)
   - **Company**: TaskSync
   - **Address**: Your business address
   - **City**: Your city
   - **Country**: Your country
4. Click **"Create"**
5. Check your email and click the verification link

### **Step 3: Create API Key**

1. Go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name: `TaskSync API Key`
4. Permissions: **"Full Access"** (for now, you can restrict later)
5. Click **"Create & View"**
6. **Copy the API Key** (starts with `SG.`)

### **Step 4: Create Email Templates**

#### **OTP Template**
1. Go to **Email API** → **Dynamic Templates**
2. Click **"Create Template"**
3. Name: `TaskSync OTP Template`
4. Click **"Create Template"**
5. Click **"Add Version"**
6. Choose **"Blank Template"**
7. Design your OTP email:

```html
<!DOCTYPE html>
<html>
<head>
    <title>TaskSync Verification Code</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>🔐 TaskSync Verification</h1>
            <p>Your verification code is ready</p>
        </div>
        <div style="padding: 30px;">
            <h2>Hello {{user_name}}!</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">{{otp_code}}</h1>
            </div>
            <p><strong>This code expires in {{expiry_minutes}} minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
            <p>TaskSync - Your Personal Task Manager</p>
        </div>
    </div>
</body>
</html>
```

8. Click **"Save"**
9. Copy the **Template ID** (starts with `d-`)

#### **Invitation Template**
1. Create another template named `TaskSync Invitation Template`
2. Use this HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>You're Invited to TaskSync</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎉 You're Invited!</h1>
            <p>{{inviter_name}} has invited you to join {{workspace_name}}</p>
        </div>
        <div style="padding: 30px;">
            <h2>Welcome to TaskSync!</h2>
            <p>{{inviter_name}} thinks you'd be a great addition to the team and has invited you to join {{workspace_name}} on TaskSync.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{invitation_url}}" style="display: inline-block; padding: 15px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
            </div>
            <p><strong>This invitation expires in {{expiry_hours}} hours.</strong></p>
            <p>If you have any questions, please contact {{inviter_name}}.</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
            <p>TaskSync - Your Personal Task Manager</p>
        </div>
    </div>
</body>
</html>
```

### **Step 5: Update Environment Variables**

#### **Option A: AWS Elastic Beanstalk (Production)**
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
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@domain.com
SENDGRID_FROM_NAME=TaskSync
```

#### **Option B: Local Development (.env file)**
Create or update your `.env` file in the backend root directory:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@domain.com
SENDGRID_FROM_NAME=TaskSync

# Remove or comment out old email variables
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=your-gmail@gmail.com
# EMAIL_PASS=your-app-password
# EMAIL_FROM_NAME=TaskSync

# Remove or comment out AWS SES variables
# AWS_SES_ACCESS_KEY_ID=your_access_key
# AWS_SES_SECRET_ACCESS_KEY=your_secret_key
# AWS_SES_REGION=us-east-1
# AWS_SES_FROM_EMAIL=noreply@tasksync.org
```

**Test your environment variables:**
```bash
node test-env-variables.js
```

### **Step 6: Update Template IDs**

In the `email-validation-service.ts` file, update the template IDs:

```typescript
// Line 105: Update OTP template ID
template_id: 'd-your-otp-template-id' // Replace with your actual template ID

// Line 155: Update invitation template ID  
template_id: 'd-your-invitation-template-id' // Replace with your actual template ID
```

### **Step 7: Apply Configuration**

1. Click **"Apply"** in Elastic Beanstalk
2. Wait for the application to restart
3. Test the endpoints

## 🧪 **Testing Your Setup**

### **Test Email Validation**
```bash
curl -X POST https://taskSync.ap-south-1.elasticbeanstalk.com/api/invitations/validate-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### **Test OTP Registration**
```bash
curl -X POST https://taskSync.ap-south-1.elasticbeanstalk.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@example.com",
    "password": "Test123456"
  }'
```

### **Test User Invitation**
```bash
curl -X POST https://taskSync.ap-south-1.elasticbeanstalk.com/api/invitations/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "invite@example.com",
    "workspaceName": "My Team"
  }'
```

## ✅ **Expected Results**

After setup, you should have:
- ✅ **Email validation** working for any email address
- ✅ **OTP registration** sending verification codes
- ✅ **User invitations** working without restrictions
- ✅ **Professional email templates** with your branding
- ✅ **No sandbox limitations** - send to any email

## 🔍 **Monitoring**

1. **SendGrid Dashboard** - Monitor email delivery
2. **Activity Feed** - See sent emails and bounces
3. **Statistics** - Track open rates and clicks
4. **Bounce Management** - Handle failed deliveries

## 🚀 **Next Steps**

1. **Immediate**: Set up SendGrid and test
2. **This Week**: Customize email templates
3. **Next Week**: Set up email analytics
4. **Future**: Upgrade to paid plan if needed

**This solution will completely replace AWS SES and solve all your email restrictions!**
