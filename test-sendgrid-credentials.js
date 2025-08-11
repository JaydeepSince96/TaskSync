#!/usr/bin/env node
require('dotenv').config();

console.log('🔍 Testing SendGrid Credentials\n');

// Check if credentials exist
const credentials = {
  'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
  'SENDGRID_FROM_EMAIL': process.env.SENDGRID_FROM_EMAIL,
  'SENDGRID_FROM_NAME': process.env.SENDGRID_FROM_NAME
};

console.log('📧 SendGrid Configuration:');
Object.entries(credentials).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? `${value.substring(0, 15)}...` : 'NOT SET';
  console.log(`   ${status} ${key}: ${displayValue}`);
});

// Test API key format
if (process.env.SENDGRID_API_KEY) {
  const isValidFormat = process.env.SENDGRID_API_KEY.startsWith('SG.') && process.env.SENDGRID_API_KEY.length > 20;
  console.log(`\n🔑 API Key Format: ${isValidFormat ? '✅ Valid' : '❌ Invalid'}`);
}

// Test email format
if (process.env.SENDGRID_FROM_EMAIL) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(process.env.SENDGRID_FROM_EMAIL);
  console.log(`📧 Email Format: ${isValidEmail ? '✅ Valid' : '❌ Invalid'}`);
}

console.log('\n📋 Summary:');
const allSet = Object.values(credentials).every(value => value);
console.log(`   ${allSet ? '✅ All credentials are set' : '❌ Some credentials are missing'}`);

if (allSet) {
  console.log('\n🚀 Ready to test email sending!');
  console.log('   Run: node test-email-sending.js');
} else {
  console.log('\n⚠️  Please set all required credentials first.');
}
