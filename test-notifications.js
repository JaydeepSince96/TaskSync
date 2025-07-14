// Quick test script to verify notification system functionality
// Run with: node test-notifications.js

const API_BASE = 'http://localhost:3000/api';

// Test notification services status
async function testNotificationStatus() {
  try {
    console.log('🔍 Testing notification services health...');
    
    const response = await fetch(`${API_BASE}/notifications/health`);
    const data = await response.json();
    
    console.log('📊 Services Health Check:');
    console.log(`Overall Status: ${data.data?.overall?.status || 'unknown'}`);
    console.log(`Services Ready: ${data.data?.overall?.ready || 0}/${data.data?.overall?.total || 3} (${data.data?.overall?.percentage || 0}%)`);
    console.log('\nService Details:');
    
    if (data.data?.services) {
      const services = data.data.services;
      console.log(`📱 WhatsApp: ${services.whatsapp?.status || 'unknown'} ${services.whatsapp?.enabled ? '✅' : '❌'}`);
      console.log(`📧 Email: ${services.email?.status || 'unknown'} ${services.email?.enabled ? '✅' : '❌'}`);
      console.log(`📲 Push: ${services.push?.status || 'unknown'} ${services.push?.enabled ? '✅' : '❌'}`);
    }
    
    if (data.data?.test_mode) {
      console.log('\n🧪 Test Mode: ENABLED (notifications will be logged, not sent)');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error testing status:', error.message);
    return null;
  }
}

// Test WhatsApp service
async function testWhatsApp(phoneNumber = '+1234567890') {
  try {
    console.log('\n📱 Testing WhatsApp service...');
    
    const response = await fetch(`${API_BASE}/notifications/whatsapp/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber })
    });
    
    const data = await response.json();
    console.log('WhatsApp Test Result:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error testing WhatsApp:', error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Notification System Tests\n');
  console.log('================================\n');
  
  // Test 1: Check services status
  await testNotificationStatus();
  
  // Test 2: Test WhatsApp (works without auth)
  await testWhatsApp();
  
  console.log('\n================================');
  console.log('✅ Test completed!');
  console.log('\n💡 To enable full functionality:');
  console.log('   1. Set up credentials in .env file');
  console.log('   2. See NOTIFICATION_SETUP_GUIDE.md for details');
  console.log('   3. Restart the server after updating .env');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testNotificationStatus, testWhatsApp, runTests };
