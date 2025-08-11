// Test script to check what email configuration is running on the deployed server
const axios = require('axios');

async function testEmailServiceStatus() {
  try {
    console.log('🔍 Testing deployed email service configuration...\n');
    
    // Test a request that should show us what email service is being used
    const response = await axios.post('https://api.tasksync.org/api/auth/send-otp', {
      name: 'Config Test',
      email: 'config-test@example.com',
      password: 'Test123456'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ Unexpected success:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('📋 Server Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      
      // Analyze the error message to understand which email service is being used
      const message = error.response.data?.message || '';
      
      console.log('\n🔍 Analysis:');
      if (message.includes('Email service is not configured')) {
        console.log('❌ Email service is not properly configured on server');
        console.log('🔧 This means the fix WAS deployed (we see our new error message)');
        console.log('💡 But AWS SES or other email providers are not working');
      } else if (message.includes('Failed to send verification email')) {
        console.log('❌ Email service failed to send');
        console.log('🔧 This could mean the fix was deployed but AWS SES has issues');
        console.log('💡 Or the old code is still running');
      } else if (message.includes('535 Authentication Credentials Invalid')) {
        console.log('❌ Still getting SMTP authentication errors');
        console.log('🔧 The fix was NOT deployed successfully');
        console.log('💡 Server is still using invalid SMTP configuration');
      } else {
        console.log('❓ Unknown error pattern:', message);
      }
      
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Also test a simple endpoint to verify server is responding
async function testServerHealth() {
  try {
    console.log('\n🏥 Testing server health...');
    const response = await axios.get('https://api.tasksync.org/api/health', { timeout: 5000 });
    console.log('✅ Server is healthy:', response.status);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
  }
}

async function main() {
  await testServerHealth();
  await testEmailServiceStatus();
}

main();
