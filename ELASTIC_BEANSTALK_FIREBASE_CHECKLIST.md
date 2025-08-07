# 🔥 Elastic Beanstalk Firebase FCM Setup Checklist

## ✅ **Environment Variables Verification**

### **Check in AWS Console:**
1. Go to **Elastic Beanstalk Console**
2. Select your environment
3. Go to **Configuration** → **Software**
4. Verify these environment variables are set:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

## 📁 **Service Account File Upload**

### **Option 1: Using Deployment Script**
```bash
cd P12-class-based-ts-CRUD
chmod +x deploy-with-firebase.sh
./deploy-with-firebase.sh
```

### **Option 2: Manual Upload**
1. Download `firebase-service-account.json` from Firebase Console
2. Place it in your backend root directory
3. Deploy to Elastic Beanstalk

## 🔍 **Verification Steps**

### **1. Check Application Logs**
```bash
eb logs --all
```
Look for:
- ✅ `"✅ FCM push notification service initialized successfully"`
- ❌ Any Firebase-related errors

### **2. Test Health Endpoint**
```bash
curl https://your-eb-url/api/notifications/health
```

### **3. Run Verification Script**
```bash
chmod +x verify-firebase-setup.sh
./verify-firebase-setup.sh
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Firebase service account file not found"**
**Solution:**
- Ensure `firebase-service-account.json` is in the root directory
- Check file permissions
- Verify the file path in environment variables

### **Issue 2: "FCM push notification service not initialized"**
**Solution:**
- Check environment variables are correctly set
- Verify service account file is accessible
- Check application logs for specific errors

### **Issue 3: "Invalid private key format"**
**Solution:**
- Ensure private key includes `\n` for newlines
- Check quotes around the private key value
- Verify the key is complete

## 🎯 **Success Indicators**

### **✅ Working Setup:**
- Application starts without Firebase errors
- Logs show: `"✅ FCM push notification service initialized successfully"`
- Health endpoint returns Firebase status
- No environment variable errors

### **❌ Issues to Fix:**
- Firebase initialization errors in logs
- Missing environment variables
- Service account file not found
- Invalid credentials

## 📋 **Final Verification**

### **Test Push Notification:**
1. Start your frontend application
2. Grant notification permissions
3. Test sending a notification via your API
4. Verify notification appears on the device

### **Check Logs Again:**
```bash
eb logs --all | grep -i "firebase\|fcm\|notification"
```

## 🔧 **Troubleshooting Commands**

### **Check Environment Variables:**
```bash
eb printenv
```

### **View Recent Logs:**
```bash
eb logs --all --all-instances
```

### **Restart Application:**
```bash
eb restart
```

### **Redeploy:**
```bash
eb deploy
```

## 📞 **Support**

If you encounter issues:
1. Check the verification script output
2. Review Elastic Beanstalk logs
3. Verify all environment variables are set
4. Ensure service account file is properly uploaded
5. Test with the provided verification endpoints 