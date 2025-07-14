#!/usr/bin/env node

// Security setup script for TaskSync notification services
const fs = require('fs');
const path = require('path');

console.log('🔒 Setting up security configuration for TaskSync...\n');

// Check if .env file exists
const envPath = '.env';
const envTemplatePath = '.env.template';

if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envTemplatePath)) {
        console.log('📋 Creating .env file from template...');
        fs.copyFileSync(envTemplatePath, envPath);
        console.log('✅ Created .env file');
        console.log('⚠️  IMPORTANT: Edit .env with your real credentials before starting the server\n');
    } else {
        console.log('❌ .env.template not found. Please ensure it exists.\n');
    }
} else {
    console.log('✅ .env file already exists\n');
}

// Set up git hooks directory
const hooksDir = '.git/hooks';
if (fs.existsSync('.git')) {
    console.log('🔧 Setting up git security hooks...');
    
    const preCommitSource = 'scripts/pre-commit-security-check.sh';
    const preCommitTarget = path.join(hooksDir, 'pre-commit');
    
    if (fs.existsSync(preCommitSource)) {
        fs.copyFileSync(preCommitSource, preCommitTarget);
        
        // Make executable (Unix/Linux/macOS)
        try {
            fs.chmodSync(preCommitTarget, '755');
            console.log('✅ Pre-commit security hook installed');
        } catch (error) {
            console.log('⚠️  Could not set executable permissions on git hook (Windows?)');
            console.log('   Hook installed but may need manual activation');
        }
    } else {
        console.log('❌ Pre-commit script not found');
    }
} else {
    console.log('⚠️  Not a git repository. Security hooks not installed.');
}

// Check current .env file for placeholder values
console.log('\n🔍 Checking current configuration...');

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const placeholders = [
        'YOUR_TWILIO_ACCOUNT_SID_HERE',
        'YOUR_TWILIO_AUTH_TOKEN_HERE',
        'YOUR_EMAIL@gmail.com',
        'YOUR_16_CHARACTER_APP_PASSWORD_HERE',
        'YOUR_ONESIGNAL_APP_ID_HERE',
        'YOUR_ONESIGNAL_REST_API_KEY_HERE'
    ];
    
    const foundPlaceholders = placeholders.filter(placeholder => 
        envContent.includes(placeholder)
    );
    
    if (foundPlaceholders.length > 0) {
        console.log('⚠️  Found placeholder values in .env:');
        foundPlaceholders.forEach(placeholder => {
            console.log(`   - ${placeholder}`);
        });
        console.log('\n📝 Next steps:');
        console.log('   1. Edit .env file with your real credentials');
        console.log('   2. Follow SECURITY_CONFIGURATION.md for credential setup');
        console.log('   3. Test with: npm run dev');
    } else {
        console.log('✅ No placeholder values found in .env');
    }
}

// Security reminders
console.log('\n🛡️  Security Reminders:');
console.log('✅ .env files are in .gitignore');
console.log('✅ Pre-commit hooks will check for secrets');
console.log('✅ Use NOTIFICATION_TEST_MODE=true during development');
console.log('✅ Rotate credentials regularly');
console.log('✅ Never share credentials in chat/email');

console.log('\n📚 Documentation:');
console.log('- Read: SECURITY_CONFIGURATION.md');
console.log('- Read: NOTIFICATION_SETUP_GUIDE.md');
console.log('- Check: NOTIFICATION_INTEGRATION_STATUS.md');

console.log('\n🚀 Ready to start! Run: npm run dev');
console.log('🧪 Test notifications at: http://localhost:5173/notifications/test\n');

console.log('🔒 Security setup complete!');
