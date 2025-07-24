#!/bin/bash

echo "🚀 Force Deploying TaskSync Backend..."

# Stop any running processes
echo "🛑 Stopping any running processes..."
pkill -f node || true

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf dist/ node_modules/ .ebextensions/.ebignore

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Build the application
echo "🔨 Building TypeScript application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Force deploy with specific version
echo "🌐 Force deploying to Elastic Beanstalk..."

# First, try to validate the configuration
echo "🔍 Validating configuration..."
eb config

# Deploy with specific version
echo "📦 Deploying version v4.1..."
eb deploy --version v4.1 --timeout 20

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed! Trying alternative approach..."
    
    # Try deploying without version tag
    echo "🔄 Trying deployment without version tag..."
    eb deploy --timeout 20
    
    if [ $? -ne 0 ]; then
        echo "❌ Deployment still failed! Checking logs..."
        eb logs
        exit 1
    fi
fi

echo "✅ Deployment completed!"

# Wait for deployment to settle
echo "⏳ Waiting for deployment to settle..."
sleep 30

# Check environment status
echo "📊 Checking environment status..."
eb status

echo "🎉 Force deployment completed!"
echo "📋 Next steps:"
echo "1. Check AWS console for health status"
echo "2. Run: eb logs to see deployment logs"
echo "3. Test endpoints once healthy" 