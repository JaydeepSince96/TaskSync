#!/bin/bash

# 🔥 Firebase FCM Deployment Script for Elastic Beanstalk
# This script deploys your backend with Firebase service account file

echo "🚀 Starting deployment with Firebase FCM support..."

# Check if Firebase service account file exists
if [ ! -f "firebase-service-account.json" ]; then
    echo "❌ Error: firebase-service-account.json not found!"
    echo "📋 Please download it from Firebase Console and place it in the root directory"
    echo "🔗 Go to: Firebase Console → Project Settings → Service Accounts → Generate new private key"
    exit 1
fi

echo "✅ Firebase service account file found"

# Create .ebextensions directory if it doesn't exist
mkdir -p .ebextensions

# Create configuration to copy Firebase service account file
cat > .ebextensions/01-firebase.config << 'EOF'
files:
  "/opt/elasticbeanstalk/hooks/appdeploy/post/01_copy_firebase_service_account.sh":
    mode: "000755"
    owner: root
    group: root
    content: |
      #!/bin/bash
      # Copy Firebase service account file to the correct location
      if [ -f "/tmp/firebase-service-account.json" ]; then
        cp /tmp/firebase-service-account.json /var/app/current/firebase-service-account.json
        chmod 600 /var/app/current/firebase-service-account.json
        echo "✅ Firebase service account file copied successfully"
      else
        echo "⚠️ Firebase service account file not found in /tmp/"
      fi

container_commands:
  01_copy_firebase_service_account:
    command: |
      if [ -f "firebase-service-account.json" ]; then
        cp firebase-service-account.json /tmp/firebase-service-account.json
        echo "✅ Firebase service account file prepared for deployment"
      else
        echo "❌ firebase-service-account.json not found in current directory"
        exit 1
      fi
EOF

echo "✅ Created Elastic Beanstalk configuration for Firebase"

# Check if .ebignore exists, if not create it
if [ ! -f ".ebignore" ]; then
    echo "📝 Creating .ebignore file..."
    cat > .ebignore << 'EOF'
# Ignore unnecessary files for deployment
node_modules/
npm-debug.log
.git/
.gitignore
README.md
*.md
.env
.env.local
.env.example
*.log
.DS_Store
EOF
fi

echo "✅ .ebignore file ready"

# Deploy to Elastic Beanstalk
echo "🚀 Deploying to Elastic Beanstalk..."
eb deploy

echo "✅ Deployment completed!"
echo "🔍 Check your Elastic Beanstalk logs for Firebase initialization messages"
echo "📋 Look for: '✅ FCM push notification service initialized successfully'" 