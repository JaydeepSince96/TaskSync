#!/bin/bash

# Google Auth Redirect and PaymentPage Fix Deployment Script
echo "🚀 Deploying Google Auth Redirect and PaymentPage Fixes..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to AWS Elastic Beanstalk
echo "🌐 Deploying to AWS Elastic Beanstalk..."
eb deploy

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment successful!"

# Wait a moment for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 10

# Test the Google Auth endpoint
echo "🧪 Testing Google Auth endpoint..."
curl -I "https://api.tasksync.org/api/auth/google"

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Changes deployed:"
echo "  ✅ Fixed Google Auth redirect flow (backend → login → payment)"
echo "  ✅ Updated PaymentPage UI (removed confusing navigation buttons)"
echo "  ✅ Fixed FRONTEND_URL configuration consistency"
echo "  ✅ Set quarterly plan as default selection"
echo ""
echo "🔍 To test:"
echo "  1. Try Google Auth with a NEW email address"
echo "  2. Verify redirect flow: Google Auth → Login Page → Payment Page"
echo "  3. Check that PaymentPage shows clean UI without redundant information"
echo ""
echo "📝 Check AWS logs for debug messages:"
echo "  - 'Google callback: Redirecting to login page (first-time Google Auth)'"
echo "  - 'Google OAuth: First time using Google Auth for existing user'"
echo ""
echo "🔄 Expected Flow:"
echo "  Backend → /login?auth=success&new_user=true"
echo "  LoginPage → /payment?auth=success&new_user=true"
echo "  PaymentPage → Shows welcome message"
