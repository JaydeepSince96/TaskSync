# 🔧 CORS Troubleshooting Guide

## 🚨 **Current Issue: CORS Error**

You're getting a CORS error when trying to register:
```
Request URL: https://api.tasksync.org/api/auth/send-otp
Error: CORS policy blocked the request
```

## 🔍 **Step 1: Identify Your Frontend Domain**

First, let's identify what domain your frontend is running on:

### **Check Your Frontend URL**
1. **Open your browser's Developer Tools** (F12)
2. **Go to the Console tab**
3. **Look at the URL in your browser's address bar**
4. **Note the exact domain** (e.g., `https://app.tasksync.org`, `https://tasksync.org`, etc.)

## 🔧 **Step 2: Update CORS Configuration**

### **Option A: Quick Fix - Allow All Origins (Development Only)**

If you're in development, you can temporarily allow all origins:

```typescript
// In src/app.ts, replace the corsOptions with:
const corsOptions = {
  origin: true, // Allow all origins
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};
```

### **Option B: Add Your Specific Domain**

Add your frontend domain to the `allowedOrigins` array:

```typescript
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
  "https://taskSync.ap-south-1.elasticbeanstalk.com",
  "https://tasksync.org",
  "https://www.tasksync.org",
  "http://tasksync.org",
  "http://www.tasksync.org",
  "https://api.tasksync.org",
  "https://app.tasksync.org",
  // ADD YOUR FRONTEND DOMAIN HERE
  "https://your-frontend-domain.com"
];
```

## 🧪 **Step 3: Test CORS Configuration**

### **Test 1: CORS Test Endpoint**
```bash
# Test from your frontend domain
curl -H "Origin: https://your-frontend-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.tasksync.org/api/cors-test
```

### **Test 2: Browser Console Test**
Open your browser's console and run:
```javascript
fetch('https://api.tasksync.org/api/cors-test', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('CORS Test:', data))
.catch(error => console.error('CORS Error:', error));
```

## 🔍 **Step 4: Debug CORS Issues**

### **Check Server Logs**
Look at your server logs to see what origin is being blocked:

```bash
# In your server logs, you should see:
# [timestamp] OPTIONS /api/auth/send-otp — Origin: https://your-frontend-domain.com
# Production mode: Blocking origin: https://your-frontend-domain.com
```

### **Common Issues and Solutions**

#### **Issue 1: Protocol Mismatch**
- **Problem**: Frontend on `https://` but backend expects `http://`
- **Solution**: Add both protocols to allowedOrigins

#### **Issue 2: Subdomain Mismatch**
- **Problem**: Frontend on `app.tasksync.org` but backend only allows `tasksync.org`
- **Solution**: Add subdomain to allowedOrigins or use wildcard pattern

#### **Issue 3: Port Mismatch**
- **Problem**: Frontend on `localhost:3001` but backend only allows `localhost:3000`
- **Solution**: Add the correct port to allowedOrigins

## 🚀 **Step 5: Production Deployment**

### **Update Environment Variables**
Make sure your `FRONTEND_URL` environment variable is set correctly:

```env
# In your .env file or Elastic Beanstalk environment
FRONTEND_URL=https://your-frontend-domain.com
```

### **Deploy the Changes**
```bash
# Build and deploy
npm run build
eb deploy
```

## 🔧 **Step 6: Alternative Solutions**

### **Solution 1: Use a Proxy (Development)**
If you're using Vite or similar, add a proxy in your frontend config:

```javascript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.tasksync.org',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
```

### **Solution 2: Use Relative URLs**
In your frontend API calls, use relative URLs:

```javascript
// Instead of: https://api.tasksync.org/api/auth/send-otp
// Use: /api/auth/send-otp
```

### **Solution 3: Add CORS Headers Manually**
Add CORS headers to specific routes:

```typescript
// In your auth routes
app.use('/api/auth', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://your-frontend-domain.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

## 📋 **Step 7: Verification Checklist**

- [ ] **Frontend domain** is in `allowedOrigins` array
- [ ] **Protocol matches** (http vs https)
- [ ] **Port matches** (if using localhost)
- [ ] **Subdomain is included** (if using subdomains)
- [ ] **Environment variables** are set correctly
- [ ] **Server is restarted** after changes
- [ ] **Browser cache is cleared**
- [ ] **CORS test endpoint** works

## 🎯 **Quick Fix Commands**

### **For Development:**
```bash
# 1. Update CORS to allow all origins temporarily
# 2. Restart your server
npm run dev

# 3. Test the registration
# 4. Once working, add specific domain to allowedOrigins
```

### **For Production:**
```bash
# 1. Add your frontend domain to allowedOrigins
# 2. Deploy to Elastic Beanstalk
eb deploy

# 3. Test the registration flow
```

## 📞 **Need Help?**

If you're still having issues:

1. **Share your frontend domain** (the exact URL)
2. **Share the server logs** showing the CORS error
3. **Share your current allowedOrigins** configuration
4. **Test the CORS endpoint** and share the result

**Example:**
```
Frontend Domain: https://app.tasksync.org
Server Log: Production mode: Blocking origin: https://app.tasksync.org
Current allowedOrigins: ["https://tasksync.org", "https://www.tasksync.org"]
```

This will help me provide a more specific solution!
