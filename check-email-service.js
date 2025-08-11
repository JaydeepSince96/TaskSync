// Email Service Diagnostic Script
// Run with: node check-email-service.js

require('dotenv').config();

console.log('🔍 Email Service Configuration Check');
console.log('='.repeat(50));

// Check all possible email provider configurations
const emailProviders = {
  sendgrid: {
    name: 'SendGrid',
    required: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
    optional: ['SENDGRID_FROM_NAME']
  },
  mailgun: {
    name: 'Mailgun', 
    required: ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN', 'MAILGUN_FROM_EMAIL'],
    optional: []
  },
  aws_ses: {
    name: 'AWS SES',
    required: ['AWS_SES_ACCESS_KEY_ID', 'AWS_SES_SECRET_ACCESS_KEY', 'AWS_SES_FROM_EMAIL'],
    optional: ['AWS_SES_REGION']
  },
  smtp: {
    name: 'SMTP',
    required: ['EMAIL_USER', 'EMAIL_PASS'],
    optional: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_SECURE', 'EMAIL_FROM_NAME']
  }
};

let configuredProvider = null;

console.log('\n📋 Checking Email Provider Configurations:\n');

for (const [key, provider] of Object.entries(emailProviders)) {
  console.log(`${provider.name}:`);
  
  const missingRequired = provider.required.filter(env => !process.env[env]);
  const hasRequired = missingRequired.length === 0;
  
  if (hasRequired) {
    console.log(`  ✅ All required variables present`);
    if (!configuredProvider) {
      configuredProvider = provider.name;
    }
  } else {
    console.log(`  ❌ Missing required: ${missingRequired.join(', ')}`);
  }
  
  // Show what's configured
  provider.required.concat(provider.optional).forEach(env => {
    const value = process.env[env];
    if (value) {
      const displayValue = env.includes('KEY') || env.includes('PASS') ? 
        value.substring(0, 8) + '...' : value;
      console.log(`    ${env}: ${displayValue}`);
    }
  });
  
  console.log();
}

console.log('📊 Summary:');
console.log('='.repeat(30));

if (configuredProvider) {
  console.log(`✅ Email service should work with: ${configuredProvider}`);
  console.log(`📧 The EmailService will use ${configuredProvider} for sending emails`);
} else {
  console.log('❌ No email provider is properly configured!');
  console.log('📧 Email service will be disabled');
  console.log('\n💡 Quick fix options:');
  console.log('1. Gmail SMTP (easiest for testing):');
  console.log('   EMAIL_HOST=smtp.gmail.com');
  console.log('   EMAIL_PORT=587');
  console.log('   EMAIL_SECURE=false');
  console.log('   EMAIL_USER=your-gmail@gmail.com');
  console.log('   EMAIL_PASS=your-app-password');
  console.log('   EMAIL_FROM_NAME=TaskSync');
  console.log('');
  console.log('2. SendGrid (easiest for production):');
  console.log('   SENDGRID_API_KEY=SG.your_api_key');
  console.log('   SENDGRID_FROM_EMAIL=noreply@yourdomain.com');
  console.log('   SENDGRID_FROM_NAME=TaskSync');
}

console.log('\n🔧 After configuring, restart your application to apply changes.');
console.log('🧪 Test with: curl -X POST your-api/auth/send-otp with valid registration data');
