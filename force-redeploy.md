# Force Redeploy Instructions

Since the Google Auth is still not working correctly, we need to ensure our changes are properly deployed.

## 🚨 **Issue Identified**
The Google Auth endpoint is working (302 redirect), but the callback logic is still using the old code. This suggests our changes weren't properly deployed.

## 🔧 **Solution: Force Complete Redeployment**

### **Step 1: Create a Deployment Package**
1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Create a ZIP file with ALL necessary files:**
   - `dist/` folder (compiled TypeScript)
   - `src/` folder (source files)
   - `package.json`
   - `package-lock.json`
   - `.ebextensions/` (if any)
   - `Procfile` (if any)

### **Step 2: Deploy via AWS Console**
1. Go to AWS Elastic Beanstalk Console
2. Select your environment (api.tasksync.org)
3. Click "Upload and Deploy"
4. Upload the ZIP file
5. Deploy the application

### **Step 3: Alternative - Git Deployment**
If you have Git set up:
1. Commit all changes:
   ```bash
   git add .
   git commit -m "Fix Google Auth redirect logic for new users"
   git push
   ```

2. Deploy via EB CLI:
   ```bash
   eb deploy
   ```

## 🔍 **Key Files That Must Be Updated**
1. `src/services/auth-service.ts` - Contains the new `isFirstTimeGoogleAuth` logic
2. `src/controllers/auth-controller.ts` - Contains the new redirect logic
3. `src/configs/passport.ts` - Contains the fixed user creation logic

## 🧪 **After Redeployment**
1. Test with a NEW email address
2. Check AWS logs for our debug messages:
   - "Google OAuth: User exists:"
   - "Google OAuth: First time using Google Auth for existing user"
   - "Google callback: Redirecting to payment page"

## 📝 **Expected Behavior**
- New users should be redirected to `/payment?auth=success&new_user=true`
- Existing users using Google Auth for first time should go to payment page
- Returning users with active subscriptions should go to dashboard
