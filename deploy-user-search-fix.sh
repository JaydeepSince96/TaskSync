#!/bin/bash

echo "🚀 Deploying user search fix to AWS Elastic Beanstalk..."

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
eb deploy --message "Fix user search endpoint - add better error handling and debugging"

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔍 The user search endpoint should now work correctly."
    echo "📧 Test the endpoints:"
    echo "   - https://api.tasksync.org/api/users/test (no auth required)"
    echo "   - https://api.tasksync.org/api/users/search?query=test (requires auth)"
    echo ""
    echo "🔧 Run the test script to verify:"
    echo "   node test-user-search.js"
else
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment complete!"
