#!/bin/bash

echo "🚀 Starting TaskSync Backend Deployment..."

# Build the application
echo "📦 Building TypeScript application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Check if we're in the right directory
if [ ! -f ".ebextensions/01_custom_domain.config" ]; then
    echo "❌ Error: .ebextensions directory not found. Make sure you're in the backend directory."
    exit 1
fi

# Deploy to Elastic Beanstalk
echo "🌐 Deploying to Elastic Beanstalk..."
eb deploy

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed! Check the logs with 'eb logs'"
    exit 1
fi

echo "✅ Deployment completed successfully!"

# Wait a moment for the deployment to settle
echo "⏳ Waiting for deployment to settle..."
sleep 10

# Test the endpoints
echo "🧪 Testing endpoints..."

echo "Testing root endpoint..."
curl -s http://www.tasksync.org/ | head -c 200

echo -e "\nTesting health endpoint..."
curl -s http://www.tasksync.org/api/health | head -c 200

echo -e "\nTesting CORS endpoint..."
curl -s http://www.tasksync.org/api/cors-test | head -c 200

echo -e "\n🎉 Deployment and testing completed!"
echo "📊 Check your Elastic Beanstalk console for health status."
echo "🔍 If you see issues, run: eb logs" 