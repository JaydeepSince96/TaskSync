#!/bin/bash

echo "🚀 Deploying Cookie Domain Fix for Google Auth"
echo "=============================================="

# Navigate to backend directory
cd P12-class-based-ts-CRUD

echo ""
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"

echo ""
echo "🚀 Deploying to AWS Elastic Beanstalk..."
eb deploy

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"

echo ""
echo "⏳ Waiting for deployment to complete..."
sleep 30

echo ""
echo "🧪 Testing Google Auth endpoint..."
curl -I "https://api.tasksync.org/api/auth/google"

echo ""
echo "🎯 Cookie Domain Fix Deployed Successfully!"
echo ""
echo "📋 What was fixed:"
echo "   - Added domain: '.tasksync.org' for production cookies"
echo "   - Added path: '/' for all cookies"
echo "   - This ensures cookies work across subdomains"
echo ""
echo "🔍 Test the fix:"
echo "   1. Go to https://www.tasksync.org/login"
echo "   2. Click 'Continue with Google'"
echo "   3. Complete OAuth"
echo "   4. Check browser console for: 'Google Auth tokens transferred to localStorage in LoginPage'"
echo "   5. Verify you're redirected to payment page with proper authentication"
echo ""
echo "📊 Debug Tool:"
echo "   Use the debug tool at: React-Typescript-Practice/debug-google-auth-flow.html"
echo "   to verify cookies are being set correctly"
