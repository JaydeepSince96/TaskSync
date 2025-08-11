# 🔧 AWS Issues Fix Guide

## 🚨 **Current Issues**

1. **MongoDB Connection Error**: IP not whitelisted in MongoDB Atlas
2. **Duplicate Schema Indexes**: Multiple indexes on `expiresAt` field
3. **CORS Issues**: Frontend can't connect to backend

## 🔧 **Issue 1: MongoDB Connection Fix**

### **Step 1: Fix MongoDB Atlas IP Whitelist**

**Option A: Quick Fix (Allow All IPs)**
1. **Go to MongoDB Atlas Dashboard**
2. **Network Access** → **IP Access List**
3. **Add IP Address**
4. **Enter**: `0.0.0.0/0`
5. **Description**: `AWS Elastic Beanstalk`
6. **Click "Add"**

**Option B: Get Your AWS IP (Recommended)**
```bash
# Get your Elastic Beanstalk IP
curl ifconfig.me

# Or check AWS Console:
# Elastic Beanstalk → Your Environment → Configuration → Instances
```

### **Step 2: Verify MongoDB Connection**
```bash
# Test connection from your server
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));
"
```

## 🔧 **Issue 2: Duplicate Indexes Fix**

### **Step 1: Fixed in Code**
I've already fixed the duplicate indexes in `src/models/otp-model.ts`:
- ✅ Removed duplicate `expiresAt` index
- ✅ Kept only the TTL index for automatic cleanup

### **Step 2: Deploy the Fix**
```bash
npm run build
eb deploy
```

## 🔧 **Issue 3: CORS Fix**

### **Step 1: Quick CORS Fix**
Update `src/app.ts` with this temporary fix:

```typescript
const corsOptions = {
  origin: true, // Allow all origins temporarily
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};
```

### **Step 2: Deploy CORS Fix**
```bash
npm run build
eb deploy
```

## 🚀 **Complete Fix Process**

### **Step 1: Fix MongoDB Atlas**
1. **Go to MongoDB Atlas**
2. **Network Access** → **Add IP Address**
3. **Add**: `0.0.0.0/0` (temporary) or your AWS IP
4. **Save**

### **Step 2: Deploy Code Fixes**
```bash
# Build and deploy
npm run build
eb deploy
```

### **Step 3: Test Everything**
1. **Check MongoDB connection** in logs
2. **Test registration** (should work now)
3. **Test invitation system**
4. **Check for duplicate index warnings** (should be gone)

## 📊 **Monitoring**

### **Check AWS Logs**
```bash
# View recent logs
eb logs --all

# Monitor in real-time
eb logs --follow
```

### **Expected Results**
After fixes, you should see:
- ✅ **No MongoDB connection errors**
- ✅ **No duplicate index warnings**
- ✅ **Registration working**
- ✅ **CORS errors resolved**

## 🔒 **Security Notes**

### **MongoDB Security**
- **Temporary**: `0.0.0.0/0` allows all IPs
- **Production**: Add only your AWS IP range
- **Monitor**: Check MongoDB Atlas logs for unauthorized access

### **CORS Security**
- **Temporary**: `origin: true` allows all origins
- **Production**: Add only your frontend domain
- **Example**: `["https://app.tasksync.org", "https://tasksync.org"]`

## 🎯 **Verification Checklist**

- [ ] **MongoDB Atlas IP whitelist** updated
- [ ] **Duplicate indexes** removed from code
- [ ] **CORS configuration** updated
- [ ] **Code deployed** to Elastic Beanstalk
- [ ] **MongoDB connection** working
- [ ] **Registration flow** working
- [ ] **No duplicate index warnings** in logs
- [ ] **CORS errors** resolved

## 📞 **Troubleshooting**

### **If MongoDB Still Fails**
1. **Check IP whitelist** in MongoDB Atlas
2. **Verify connection string** in environment variables
3. **Check network connectivity** from AWS

### **If CORS Still Fails**
1. **Check frontend domain** in browser
2. **Verify CORS configuration** deployed
3. **Clear browser cache**

### **If Registration Still Fails**
1. **Check SendGrid credentials** are set
2. **Verify email service** is working
3. **Test with CORS test endpoint**

## 🎉 **Success Indicators**

You'll know everything is working when:
- ✅ **AWS logs show**: "MongoDB connected successfully"
- ✅ **No warnings**: "Duplicate schema index"
- ✅ **Registration works**: User can sign up with OTP
- ✅ **Invitations work**: Users can invite others
- ✅ **No CORS errors**: Frontend can call backend APIs

---

## 🚀 **Next Steps**

1. **Apply all fixes** above
2. **Deploy to production**
3. **Test complete user flow**
4. **Monitor logs** for any remaining issues
5. **Secure configurations** (remove `0.0.0.0/0`, add specific domains)

**Your TaskSync application should be fully functional after these fixes!** 🎉
