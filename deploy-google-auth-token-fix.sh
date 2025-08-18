#!/bin/bash

# Google Auth Token Transfer Fix - Deployment Script
echo "🚀 Deploying Google Auth Token Transfer Fix..."

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
echo "✅ Backend now sets both httpOnly and non-httpOnly cookies for Google Auth"
echo "✅ Frontend PaymentPage transfers cookies to localStorage"
echo "✅ Users will now be properly authenticated after Google Auth"
echo ""
echo "🧪 Test the fix:"
echo "1. Go to https://www.tasksync.org/login"
echo "2. Click 'Continue with Google'"
echo "3. Complete Google OAuth"
echo "4. Should redirect to payment page with proper authentication"
echo ""
echo "🔍 Check browser console for: 'Google Auth tokens transferred to localStorage'"
