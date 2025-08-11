#!/usr/bin/env node

/**
 * Test Environment Variables
 * Verifies that all required environment variables are properly loaded
 */

require('dotenv').config();

console.log('🔍 Testing Environment Variables\n');

// Test SendGrid variables
const sendGridVars = {
  'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
  'SENDGRID_FROM_EMAIL': process.env.SENDGRID_FROM_EMAIL,
  'SENDGRID_FROM_NAME': process.env.SENDGRID_FROM_NAME
};

console.log('📧 SendGrid Configuration:');
Object.entries(sendGridVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? `${value.substring(0, 10)}...` : 'NOT SET';
  console.log(`   ${status} ${key}: ${displayValue}`);
});

// Test other email variables
const emailVars = {
  'EMAIL_HOST': process.env.EMAIL_HOST,
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASS': process.env.EMAIL_PASS,
  'AWS_SES_ACCESS_KEY_ID': process.env.AWS_SES_ACCESS_KEY_ID,
  'AWS_SES_SECRET_ACCESS_KEY': process.env.AWS_SES_SECRET_ACCESS_KEY
};

console.log('\n📧 Other Email Configuration:');
Object.entries(emailVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? `${value.substring(0, 10)}...` : 'NOT SET';
  console.log(`   ${status} ${key}: ${displayValue}`);
});

// Test basic app variables
const appVars = {
  'PORT': process.env.PORT,
  'MONGO_URI': process.env.MONGO_URI,
  'JWT_SECRET': process.env.JWT_SECRET,
  'FRONTEND_URL': process.env.FRONTEND_URL
};

console.log('\n⚙️ App Configuration:');
Object.entries(appVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? value : 'NOT SET';
  console.log(`   ${status} ${key}: ${displayValue}`);
});

console.log('\n📋 Summary:');
const sendGridConfigured = sendGridVars.SENDGRID_API_KEY && sendGridVars.SENDGRID_FROM_EMAIL;
const otherEmailConfigured = emailVars.EMAIL_HOST || emailVars.AWS_SES_ACCESS_KEY_ID;

if (sendGridConfigured) {
  console.log('✅ SendGrid is configured - Ready to use!');
} else if (otherEmailConfigured) {
  console.log('⚠️ Other email service configured - Consider switching to SendGrid');
} else {
  console.log('❌ No email service configured - Please set up SendGrid');
}

console.log('\n💡 To set up SendGrid, follow the SENDGRID_SETUP_GUIDE.md');
