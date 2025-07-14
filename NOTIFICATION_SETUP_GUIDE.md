# Notification Setup Guide - TaskSync Application

This comprehensive guide will help you set up all notification services for the TaskSync application securely.

## 🚀 Quick Start

1. **Run Security Setup**
   ```bash
   npm run setup-security
   ```

2. **Edit Environment Variables**
   ```bash
   # Copy template if not done automatically
   cp .env.template .env
   
   # Edit with your credentials
   notepad .env  # Windows
   # or
   nano .env     # Linux/macOS
   ```

3. **Test Notifications**
   ```bash
   npm run dev
   # Navigate to: http://localhost:5173/notifications/test
   ```

## 📱 WhatsApp Setup (Twilio)

### Step 1: Create Twilio Account
1. Visit [twilio.com](https://www.twilio.com)
2. Sign up for free account
3. Verify phone number

### Step 2: Set Up WhatsApp Sandbox
1. Console → Messaging → Try it out → Send a WhatsApp message
2. Follow instructions to join sandbox
3. Note the sandbox number

### Step 3: Get Credentials
1. Console → Account → Account Info
2. Copy Account SID and Auth Token

### Step 4: Configure Environment
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # Sandbox number
```

### Testing WhatsApp
- Use sandbox number: `whatsapp:+14155238886`
- Send "join <sandbox-code>" to WhatsApp number
- Test numbers must join sandbox first

## 🔔 Push Notifications (OneSignal)

### Step 1: Create OneSignal Account
1. Visit [onesignal.com](https://onesignal.com)
2. Sign up for free account
3. Create new app

### Step 2: Configure Web Platform
1. Choose "Web" platform
2. Enter your domain: `http://localhost:5173`
3. Follow setup wizard

### Step 3: Get Credentials
1. Settings → Keys & IDs
2. Copy App ID and REST API Key

### Step 4: Configure Environment
```env
ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_REST_API_KEY=your-rest-api-key
```

## 🧪 Development Mode

Enable test mode to prevent actual notifications during development:

```env
NOTIFICATION_TEST_MODE=true
```

This will:
- Log all notifications to console
- Return success without sending
- Allow testing without real credentials

## 🔍 Testing Your Setup

### Backend Health Check
```bash
curl http://localhost:3000/api/notifications/health
```

### Frontend Test Dashboard
1. Start both servers:
   ```bash
   # Terminal 1 - Backend
   cd P12-class-based-ts-CRUD
   npm run dev

   # Terminal 2 - Frontend  
   cd React-Typescript-Practice
   npm run dev
   ```

2. Visit: `http://localhost:5173/notifications/test`

3. Test each service:
   - Health Check
   - Email Test
   - WhatsApp Test
   - Push Notification Test

## 🛠️ Troubleshooting

### Common Issues

#### Email Not Sending
```
Error: Invalid login: 534-5.7.9 Application-specific password required
```
**Solution**: Use App Password, not regular Gmail password

#### WhatsApp 403 Error
```
Error: HTTP 403 - Forbidden
```
**Solution**: 
- Check Account SID and Auth Token
- Ensure destination number joined sandbox
- Use correct sandbox number format

#### Push Notification CORS Error
```
Error: CORS policy blocked
```
**Solution**:
- Add your domain to OneSignal settings
- Check App ID and REST API Key
- Verify web configuration

### Environment Variable Issues
```bash
# Check if variables are loaded
npm run env-check

# Verify .env file exists and has values
cat .env  # Linux/macOS
type .env  # Windows
```

### Security Check Failed
```
Error: Potential secrets detected in staged files
```
**Solution**:
- Remove sensitive data from staged files
- Check SECURITY_CONFIGURATION.md
- Use `git reset` to unstage files

## 📁 File Structure

```
project/
├── .env                           # Your credentials (not in git)
├── .env.template                  # Template with examples
├── .gitignore                     # Excludes sensitive files
├── SECURITY_CONFIGURATION.md     # Security best practices
├── scripts/
│   ├── pre-commit-security-check.sh  # Git security hook
│   └── setup-security.js             # Automated setup
└── src/
    └── api/
        └── notifications/
            └── notification-api.ts    # Frontend API integration
```

## 🔒 Security Best Practices

1. **Never Commit Credentials**
   - Use .env files only
   - Check .gitignore includes .env*
   - Run security checks before commits

2. **Rotate Credentials Regularly**
   - Change passwords monthly
   - Update API keys quarterly
   - Monitor account access

3. **Use Test Mode During Development**
   - Set NOTIFICATION_TEST_MODE=true
   - Test with sandbox accounts
   - Validate before production

4. **Monitor Service Usage**
   - Check Twilio console for usage
   - Monitor Gmail app password access
   - Review OneSignal delivery stats

## 📞 Support

### Service-Specific Help
- **Gmail**: [Google Workspace Admin Help](https://support.google.com/a/answer/176600)
- **Twilio**: [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- **OneSignal**: [OneSignal Web Push Guide](https://documentation.onesignal.com/docs/web-push-quickstart)

### Application Support
- Check console logs for detailed errors
- Use test dashboard for debugging
- Review SECURITY_CONFIGURATION.md for security issues

## ✅ Verification Checklist

- [ ] .env file created with real credentials
- [ ] Email test successful
- [ ] WhatsApp sandbox joined and tested
- [ ] Push notifications configured
- [ ] Security hooks installed
- [ ] Test dashboard accessible
- [ ] All services return 200 OK on health check

---

🎉 **Congratulations!** Your notification system is now set up and secure!

## 📧 Email Setup (Gmail)

### Step 1: Enable 2-Factor Authentication
1. Go to Google Account settings
2. Security → 2-Step Verification
3. Turn on 2-Step Verification

### Step 2: Generate App Password
1. Google Account → Security → 2-Step Verification
2. At bottom, click "App passwords"
3. Select app: "Mail"
4. Select device: "Other (custom name)"
5. Enter: "TaskSync Notifications"
6. Copy the 16-character password

### Step 3: Configure Environment
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM_NAME=TaskSync
EMAIL_FROM_EMAIL=your-email@gmail.com
```
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
