#!/bin/bash

# Google Auth Payment Redirect Fix v2 - Deployment Script
echo "🚀 Deploying Google Auth Payment Redirect Fix v2..."

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
echo "📋 What was fixed:"
echo "   ✅ Updated Google OAuth logic to properly detect users who need payment redirect"
echo "   ✅ Added 'needsPaymentRedirect' flag to handle all payment scenarios"
echo "   ✅ Fixed redirect logic for users without active subscriptions"
echo "   ✅ Enhanced logging for better debugging"
echo ""
echo "🧪 Test scenarios:"
echo "   1. New user with Google Auth → Should go to payment page"
echo "   2. Existing user without active subscription → Should go to payment page"
echo "   3. User with active subscription → Should go to dashboard"
echo ""
echo "📊 Check AWS logs for:"
echo "   - 'Google OAuth: Final flags:' with needsPaymentRedirect"
echo "   - 'Google callback: Redirecting to login page' messages"
