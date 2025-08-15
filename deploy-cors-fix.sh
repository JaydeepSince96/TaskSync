#!/bin/bash

echo "🚀 Deploying CORS and user search fix..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy using EB CLI
echo "🚀 Deploying to AWS Elastic Beanstalk..."
eb deploy --message "Fix CORS and user search - comprehensive CORS headers and authentication"

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🔧 What's been fixed:"
    echo "   ✅ CORS preflight requests (OPTIONS) working"
    echo "   ✅ User search authentication issues"
    echo "   ✅ Authorization header handling"
    echo "   ✅ Rate limiting configuration"
    echo ""
    echo "📧 Test the endpoints:"
    echo "   - https://api.tasksync.org/api/users/test (no auth required)"
    echo "   - https://api.tasksync.org/api/users/search?query=test (requires auth)"
    echo "   - https://api.tasksync.org/api/cors-test (CORS test)"
    echo ""
    echo "🔧 Run the test script to verify:"
    echo "   node test-comprehensive.js"
else
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ CORS fix deployment complete!"
