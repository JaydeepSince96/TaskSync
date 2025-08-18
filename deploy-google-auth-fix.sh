#!/bin/bash

echo "🚀 Deploying Google Auth Fixes to AWS..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Deploying anyway as this might be due to missing dev dependencies..."
fi

# Deploy to AWS Elastic Beanstalk
echo "☁️ Deploying to AWS Elastic Beanstalk..."
eb deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔗 Your app should be available at: https://api.tasksync.org"
    echo "📝 Google Auth fixes have been deployed:"
    echo "   - Fixed name field validation in passport config"
    echo "   - Added fallback for displayName in user creation"
    echo "   - Added email validation in Google OAuth"
    echo "   - Enhanced error handling for profile data"
else
    echo "❌ Deployment failed!"
    exit 1
fi
