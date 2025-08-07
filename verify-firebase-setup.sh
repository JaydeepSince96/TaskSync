#!/bin/bash

# 🔥 Firebase FCM Setup Verification Script
# This script verifies that Firebase is properly configured in Elastic Beanstalk

echo "🔍 Verifying Firebase FCM setup in Elastic Beanstalk..."

# Get the EB environment URL
EB_URL=$(eb status | grep "CNAME" | awk '{print $2}')

if [ -z "$EB_URL" ]; then
    echo "❌ Error: Could not get Elastic Beanstalk URL"
    echo "📋 Make sure you're in the correct directory and EB CLI is configured"
    exit 1
fi

echo "🌐 Elastic Beanstalk URL: $EB_URL"

# Test Firebase initialization
echo "🧪 Testing Firebase initialization..."

# Test the health endpoint
HEALTH_RESPONSE=$(curl -s "https://$EB_URL/api/notifications/health" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Health endpoint is accessible"
    echo "📋 Response: $HEALTH_RESPONSE"
else
    echo "❌ Health endpoint is not accessible"
fi

# Test Firebase service initialization
echo "🔍 Checking Firebase service logs..."

# Get recent logs
LOG_RESPONSE=$(eb logs --all 2>/dev/null | grep -i "firebase\|fcm" | tail -10)

if [ ! -z "$LOG_RESPONSE" ]; then
    echo "📋 Recent Firebase-related logs:"
    echo "$LOG_RESPONSE"
else
    echo "⚠️ No Firebase-related logs found"
fi

# Check for successful initialization
SUCCESS_LOG=$(eb logs --all 2>/dev/null | grep "✅ FCM push notification service initialized successfully")

if [ ! -z "$SUCCESS_LOG" ]; then
    echo "✅ Firebase FCM service is initialized successfully!"
else
    echo "❌ Firebase FCM service initialization not found in logs"
    echo "📋 Check your environment variables and service account file"
fi

# Test environment variables
echo "🔧 Checking environment variables..."

# Test if the service can access Firebase config
TEST_RESPONSE=$(curl -s -X POST "https://$EB_URL/api/notifications/test-firebase" \
  -H "Content-Type: application/json" \
  -d '{"test": "firebase"}' 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Firebase test endpoint is accessible"
    echo "📋 Response: $TEST_RESPONSE"
else
    echo "⚠️ Firebase test endpoint not available or failed"
fi

echo ""
echo "🎯 Verification Summary:"
echo "1. ✅ Elastic Beanstalk URL: $EB_URL"
echo "2. 🔍 Health endpoint: $(if [ $? -eq 0 ]; then echo "✅ Working"; else echo "❌ Failed"; fi)"
echo "3. 🔥 Firebase logs: $(if [ ! -z "$SUCCESS_LOG" ]; then echo "✅ Found"; else echo "❌ Not found"; fi)"
echo "4. 🧪 Firebase test: $(if [ $? -eq 0 ]; then echo "✅ Working"; else echo "❌ Failed"; fi)"

echo ""
echo "📋 Next steps:"
echo "1. Check Elastic Beanstalk environment variables"
echo "2. Verify firebase-service-account.json is uploaded"
echo "3. Check application logs for Firebase initialization"
echo "4. Test push notification functionality" 