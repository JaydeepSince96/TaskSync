#!/bin/bash

echo "🚀 Deploying Google Auth Fix v2..."
echo "=================================="

# Build the project
echo "1. Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"

# Create deployment package
echo "2. Creating deployment package..."
echo "   - Including ALL source files"
echo "   - Including compiled dist/ folder"
echo "   - Including package.json and package-lock.json"

# Create ZIP file
echo "3. Creating ZIP file..."
zip -r google-auth-fix-v2.zip src/ dist/ package.json package-lock.json

if [ $? -ne 0 ]; then
    echo "❌ ZIP creation failed!"
    exit 1
fi

echo "✅ ZIP file created: google-auth-fix-v2.zip"

echo ""
echo "🎯 Deployment Instructions:"
echo "=========================="
echo "1. Go to AWS Elastic Beanstalk Console"
echo "2. Select your environment (api.tasksync.org)"
echo "3. Click 'Upload and Deploy'"
echo "4. Upload the file: google-auth-fix-v2.zip"
echo "5. Wait for deployment to complete"
echo "6. Test Google Auth again"
echo ""

echo "🔍 What this fix does:"
echo "====================="
echo "- Fixes the profile data structure issue in Google Auth callback"
echo "- Ensures AuthService.googleOAuth receives correct profile data"
echo "- Should now show debug messages in AWS logs"
echo "- Should redirect to payment page for new users"
echo ""

echo "📋 After deployment, test with:"
echo "==============================="
echo "1. Try Google Auth with a NEW email address"
echo "2. Check if you get redirected to payment page"
echo "3. Check AWS logs for our debug messages:"
echo "   - 'Google OAuth: Creating new user'"
echo "   - 'Google callback: Redirecting to payment page'"
echo ""

echo "🎯 Expected Result:"
echo "=================="
echo "✅ New users should be redirected to:"
echo "   tasksync.org/payment?auth=success&new_user=true"
echo "❌ Instead of:"
echo "   tasksync.org/login?error=auth_failed"
