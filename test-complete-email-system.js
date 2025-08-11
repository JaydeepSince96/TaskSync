#!/usr/bin/env node
require('dotenv').config();

console.log('🧪 Testing Complete Email System\n');

// Test credentials
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

if (!allSet) {
  console.log('\n⚠️  Please set all required credentials first:');
  console.log('   SENDGRID_API_KEY=SG.your_api_key_here');
  console.log('   SENDGRID_FROM_EMAIL=your-email@domain.com');
  console.log('   SENDGRID_FROM_NAME=TaskSync');
  process.exit(1);
}

// Test email sending functions
async function testEmailSystem() {
  console.log('\n🚀 Testing Email System...\n');

  try {
    // Test 1: Send OTP Email
    console.log('📧 Test 1: Sending OTP Email...');
    const otpResult = await testOTPEmail();
    console.log(`   ${otpResult ? '✅ Success' : '❌ Failed'}`);

    // Test 2: Send Invitation Email
    console.log('\n📧 Test 2: Sending Invitation Email...');
    const invitationResult = await testInvitationEmail();
    console.log(`   ${invitationResult ? '✅ Success' : '❌ Failed'}`);

    // Test 3: Email Validation
    console.log('\n📧 Test 3: Testing Email Validation...');
    const validationResult = await testEmailValidation();
    console.log(`   ${validationResult ? '✅ Success' : '❌ Failed'}`);

    console.log('\n🎉 Email System Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Update your .env file with the actual credentials');
    console.log('   2. Deploy to Elastic Beanstalk with the new environment variables');
    console.log('   3. Test the registration flow in your application');
    console.log('   4. Test the invitation system');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

async function testOTPEmail() {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: process.env.SENDGRID_FROM_EMAIL }],
          dynamic_template_data: {
            otp_code: '123456',
            user_name: 'Test User',
            expiry_minutes: 15
          }
        }],
        from: { 
          email: process.env.SENDGRID_FROM_EMAIL, 
          name: process.env.SENDGRID_FROM_NAME 
        },
        subject: 'TaskSync - OTP Test Email',
        content: [
          {
            type: 'text/plain',
            value: 'Your OTP code is: 123456'
          },
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">TaskSync OTP Verification</h2>
                <p>Hello Test User,</p>
                <p>Your verification code is: <strong style="font-size: 24px; color: #2563eb;">123456</strong></p>
                <p>This code will expire in 15 minutes.</p>
                <hr style="margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">
                  This is a test email from TaskSync application.
                </p>
              </div>
            `
          }
        ]
      })
    });

    return response.status === 202;
  } catch (error) {
    console.error('OTP email test error:', error.message);
    return false;
  }
}

async function testInvitationEmail() {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: process.env.SENDGRID_FROM_EMAIL }],
          dynamic_template_data: {
            inviter_name: 'Test Inviter',
            workspace_name: 'TaskSync',
            invitation_url: 'https://tasksync.org/register?token=test-token'
          }
        }],
        from: { 
          email: process.env.SENDGRID_FROM_EMAIL, 
          name: process.env.SENDGRID_FROM_NAME 
        },
        subject: 'TaskSync - Invitation Test Email',
        content: [
          {
            type: 'text/plain',
            value: 'You have been invited to join TaskSync workspace.'
          },
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">TaskSync Invitation</h2>
                <p>Hello,</p>
                <p>You have been invited by <strong>Test Inviter</strong> to join the <strong>TaskSync</strong> workspace.</p>
                <p>Click the link below to accept the invitation:</p>
                <a href="https://tasksync.org/register?token=test-token" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
                <hr style="margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">
                  This is a test email from TaskSync application.
                </p>
              </div>
            `
          }
        ]
      })
    });

    return response.status === 202;
  } catch (error) {
    console.error('Invitation email test error:', error.message);
    return false;
  }
}

async function testEmailValidation() {
  try {
    // Test with a valid email
    const validEmail = 'test@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(validEmail);
    
    // Test with an invalid email
    const invalidEmail = 'invalid-email';
    const isInvalid = !emailRegex.test(invalidEmail);
    
    return isValid && isInvalid;
  } catch (error) {
    console.error('Email validation test error:', error.message);
    return false;
  }
}

// Run the test
testEmailSystem();
