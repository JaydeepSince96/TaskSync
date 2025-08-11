// Test script to verify OTP implementation
// Run with: node test-otp-implementation.js

const API_BASE_URL = 'http://localhost:5000/api'; // Update this to your backend URL

async function testOTPImplementation() {
  console.log('🧪 Testing OTP Implementation');
  console.log('='.repeat(50));

  const testEmail = 'test@example.com';
  const testData = {
    name: 'Test User',
    email: testEmail,
    password: 'Test123456'
  };

  try {
    // Test 1: Send OTP
    console.log('\n1. Testing Send OTP endpoint...');
    const sendOTPResponse = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const sendOTPResult = await sendOTPResponse.json();
    console.log('Send OTP Response:', sendOTPResult);

    if (sendOTPResult.success) {
      console.log('✅ Send OTP endpoint working correctly');
      console.log('📧 Check your email for the OTP code');
      
      // Prompt for OTP (in a real test, you'd get this from email)
      console.log('\n💡 To complete the test:');
      console.log('1. Check the email sent to', testEmail);
      console.log('2. Copy the 6-digit OTP code');
      console.log('3. Make a POST request to verify-otp endpoint:');
      console.log(`   curl -X POST ${API_BASE_URL}/auth/verify-otp \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '{"email": "${testEmail}", "otp": "YOUR_OTP_HERE"}'`);
      
    } else {
      console.log('❌ Send OTP failed:', sendOTPResult.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n📝 Make sure:');
    console.log('1. Backend server is running');
    console.log('2. Email service is configured');
    console.log('3. Database is connected');
    console.log('4. Update API_BASE_URL in this script if needed');
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed');
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🔍 Testing API endpoints availability...');
  
  const endpoints = [
    '/auth/send-otp',
    '/auth/verify-otp', 
    '/auth/resend-otp'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty body to test if endpoint exists
      });
      
      if (response.status === 404) {
        console.log(`❌ ${endpoint} - Not Found (404)`);
      } else {
        console.log(`✅ ${endpoint} - Available`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Connection failed`);
    }
  }
}

// Run tests
(async () => {
  await testAPIEndpoints();
  await testOTPImplementation();
})();
