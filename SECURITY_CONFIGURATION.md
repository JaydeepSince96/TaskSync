# 🔒 SECURITY CONFIGURATION GUIDE

## 🚨 IMPORTANT SECURITY NOTICE

**This project contains notification services that require sensitive API credentials. Follow this guide to ensure proper security.**

---

## 📋 ENVIRONMENT SETUP CHECKLIST

### ✅ **Step 1: Verify Git Security**
```bash
# Check that .env files are in gitignore
cat .gitignore | grep ".env"

# Verify no secrets are tracked
git status
git log --oneline -10
```

### ✅ **Step 2: Create Secure Environment File**
```bash
# Copy template to create your environment file
cp .env.template .env

# Edit .env with your real credentials (NEVER commit this file!)
nano .env  # or use your preferred editor
```

### ✅ **Step 3: Set Proper File Permissions**
```bash
# Restrict access to environment files (Unix/Linux/macOS)
chmod 600 .env
chmod 600 .env.*

# On Windows, use file properties to restrict access
```

---

## 🔑 CREDENTIAL SOURCES

### **Twilio (WhatsApp Notifications)**
1. **Sign up:** https://console.twilio.com/
2. **Get credentials:**
   - Account SID (starts with "AC")
   - Auth Token
3. **WhatsApp Sandbox:** Follow Twilio's WhatsApp setup guide
4. **Production:** Apply for WhatsApp Business API

### **Gmail (Email Notifications)**
1. **Enable 2FA:** https://myaccount.google.com/security
2. **Create App Password:** https://myaccount.google.com/apppasswords
3. **Use 16-character app password** (not your regular password)

### **OneSignal (Push Notifications)**
1. **Sign up:** https://onesignal.com/
2. **Create Web App**
3. **Get credentials:**
   - App ID
   - REST API Key

---

## 🛡️ SECURITY BEST PRACTICES

### **Development Environment**
- ✅ Use `.env` file for local development
- ✅ Never commit `.env` files to version control
- ✅ Use test/sandbox credentials when possible
- ✅ Enable `NOTIFICATION_TEST_MODE=true` during development

### **Production Environment**
- ✅ Use environment variables or secure secret management
- ✅ Rotate credentials regularly (every 90 days)
- ✅ Use different credentials for dev/staging/production
- ✅ Enable monitoring and alerting
- ✅ Set up rate limiting

### **Team Collaboration**
- ✅ Share credentials through secure channels (never email/chat)
- ✅ Use password managers or secret management tools
- ✅ Document who has access to what credentials
- ✅ Revoke access when team members leave

---

## 🚫 WHAT NOT TO DO

### **❌ NEVER:**
- Commit `.env` files to git
- Put credentials in source code
- Share credentials in chat/email
- Use production credentials in development
- Leave default/example credentials in production
- Share screenshots containing API keys

### **❌ AVOID:**
- Hardcoding secrets in configuration files
- Using the same credentials across environments
- Ignoring credential rotation
- Granting overly broad permissions

---

## 🔍 VERIFICATION COMMANDS

### **Check Git Status**
```bash
# Ensure .env is not tracked
git status

# Check what files are ignored
git check-ignore .env .env.local .env.production

# Verify no secrets in git history
git log --all --full-history -- .env*
```

### **Test Environment Loading**
```bash
# Start server and check logs
npm run dev

# Should see:
# ✅ Email service initialized successfully
# ❌ Twilio credentials not found (if not configured)
# ❌ OneSignal credentials not found (if not configured)
```

### **Health Check**
```bash
# Test notification health endpoint
curl http://localhost:3000/api/notifications/health

# Should return service status without exposing credentials
```

---

## 🚨 EMERGENCY PROCEDURES

### **If Credentials Are Compromised:**
1. **Immediately rotate/revoke** all affected credentials
2. **Check git history** for any committed secrets
3. **Update all environments** with new credentials
4. **Monitor for unusual activity**
5. **Review access logs**

### **If Secrets Are Committed to Git:**
1. **DO NOT** just delete the file and commit again
2. **Rotate credentials immediately**
3. **Use git tools to remove from history:**
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env' \
   --prune-empty --tag-name-filter cat -- --all
   ```
4. **Force push to all remotes** (coordinate with team)

---

## 📞 SUPPORT CONTACTS

### **For Credential Issues:**
- **Twilio Support:** https://support.twilio.com/
- **Google Support:** https://support.google.com/
- **OneSignal Support:** https://onesignal.com/support

### **For Security Questions:**
- Review this documentation first
- Check service provider's security documentation
- Consult with your security team

---

## 📚 ADDITIONAL RESOURCES

- [Twilio Security Best Practices](https://www.twilio.com/docs/usage/security)
- [Google Account Security](https://support.google.com/accounts/topic/7189123)
- [OneSignal Security](https://documentation.onesignal.com/docs/security)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Remember: Security is everyone's responsibility! When in doubt, ask for help rather than risk exposure.**
