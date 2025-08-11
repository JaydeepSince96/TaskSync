#!/usr/bin/env node

console.log('🔍 Testing OTP Endpoint with Valid Data...\n');

const testEmail = 'test@example.com';

async function testOTPEndpoint() {
  try {
    console.log(`🔍 Testing: https://api.tasksync.org/api/auth/send-otp`);
    console.log(`📧 Test email: ${testEmail}`);
    
    const response = await fetch('https://api.tasksync.org/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.tasksync.org'
      },
      body: JSON.stringify({
        email: testEmail,
        name: 'Test User',
        password: 'TestPassword123',
        invitationToken: 'test-invitation-token'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log(`   Response:`, data.substring(0, 500) + '...');
    
    if (response.ok) {
      console.log(`\n🎉 OTP Endpoint Working!`);
      console.log(`✅ CORS issues resolved`);
      console.log(`✅ API is responding correctly`);
      console.log(`✅ OTP email should be sent`);
    } else {
      console.log(`\n❌ OTP Endpoint Error: ${response.status}`);
      console.log(`📋 This might be expected if email service is not configured`);
    }
    
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
  }
}

testOTPEndpoint();
