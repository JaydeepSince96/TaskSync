# 🔔 Notification Services Setup Guide

This guide will help you set up all the notification services for TaskSync.

## 📱 1. WhatsApp (Twilio) Setup

### Step 1: Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Verify your phone number

### Step 2: Get Credentials
1. From the Twilio Console Dashboard, copy:
   - **Account SID** 
   - **Auth Token**
2. Update your `.env` file:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   ```

### Step 3: WhatsApp Sandbox (Development)
1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow instructions to join the WhatsApp sandbox
3. Send "join \<sandbox-keyword\>" to the Twilio WhatsApp number
4. Use the sandbox number: `whatsapp:+14155238886` (already set in .env)

### Step 4: Production WhatsApp (Optional)
For production, you'll need to:
1. Apply for WhatsApp Business API approval
2. Get your own WhatsApp Business number
3. Update `TWILIO_WHATSAPP_NUMBER` in .env

---

## 📧 2. Email (Gmail) Setup

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Select **Security** → **2-Step Verification**
3. Follow the setup process

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and your device
3. Copy the generated 16-character password

### Step 3: Update Environment Variables
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM_ADDRESS=your_email@gmail.com
```

### Alternative Email Providers
For other email providers, update these settings:

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
```

**Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your_email@yahoo.com
```

---

## 📲 3. Push Notifications (OneSignal) Setup

### Step 1: Create OneSignal Account
1. Go to [OneSignal](https://onesignal.com/)
2. Sign up for a free account
3. Click **Add a new app**

### Step 2: Configure App
1. Enter your app name: "TaskSync"
2. Select platform: **Web Push**
3. Configure your website URL: `http://localhost:5173` (for development)

### Step 3: Get Credentials
1. Go to **Settings** → **Keys & IDs**
2. Copy:
   - **App ID**
   - **REST API Key**
3. Update your `.env` file:
   ```env
   ONESIGNAL_APP_ID=your_app_id_here
   ONESIGNAL_API_KEY=your_rest_api_key_here
   ```

### Step 4: Frontend Integration (Optional)
To enable push notifications in your React app:
1. Add OneSignal script to your `index.html`
2. Initialize OneSignal in your React app
3. Request notification permissions from users

---

## 🧪 4. Testing the Setup

### Quick Test Commands

**Test all services:**
```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "deviceTokens": ["test-device-token"]
  }'
```

**Test WhatsApp only:**
```bash
curl -X POST http://localhost:3000/api/notifications/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

**Test Email only:**
```bash
curl -X POST http://localhost:3000/api/notifications/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using the Notification Controller

The system includes these endpoints:
- `GET /api/notifications/status` - Check service status
- `POST /api/notifications/test` - Test all services
- `POST /api/notifications/whatsapp/test` - Test WhatsApp
- `POST /api/notifications/email/test` - Test Email
- `POST /api/notifications/push/test` - Test Push notifications
- `POST /api/notifications/task-reminder/:taskId` - Send task reminder
- `POST /api/notifications/weekly-report` - Send weekly report
- `POST /api/notifications/custom` - Send custom message
- `POST/GET /api/notifications/preferences` - Manage preferences

---

## 🔧 5. Development Mode

For development/testing without real credentials:

```env
NOTIFICATION_TEST_MODE=true
```

When test mode is enabled:
- Notifications will be logged to console instead of sent
- No external API calls will be made
- Perfect for development and testing

---

## 🚨 6. Troubleshooting

### Common Issues:

**WhatsApp not working:**
- Verify you've joined the Twilio sandbox
- Check phone number format: `+1234567890`
- Ensure Account SID and Auth Token are correct

**Email not working:**
- Verify 2FA is enabled on Gmail
- Use App Password, not regular password
- Check if "Less secure app access" is needed for other providers

**Push notifications not working:**
- Verify App ID and REST API Key
- Check if device tokens are valid
- Ensure OneSignal is properly configured for your domain

### Debug Mode:
Set `NODE_ENV=development` for detailed error logs.

---

## 📝 Next Steps

1. **Set up credentials** for the services you want to use
2. **Test each service** individually using the API endpoints
3. **Configure user preferences** for notification channels
4. **Set up automated reminders** and weekly reports
5. **Add frontend integration** for push notifications (optional)

---

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use different credentials for development and production
- Regularly rotate API keys and tokens
- Enable rate limiting for notification endpoints in production

---

**Need help?** Check the server logs for detailed error messages when testing notifications.
