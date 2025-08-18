// Test script to verify Google Auth deployment
const https = require('https');

console.log('🔍 Testing Google Auth Deployment...\n');

// Test 1: Check if the API is responding
console.log('1️⃣ Testing API Health...');
https.get('https://api.tasksync.org/api/health', (res) => {
  console.log(`   Status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    console.log('   ✅ API is responding correctly');
  } else {
    console.log('   ❌ API is not responding correctly');
  }
  
  // Test 2: Check Google Auth endpoint
  console.log('\n2️⃣ Testing Google Auth endpoint...');
  https.get('https://api.tasksync.org/api/auth/google', (res) => {
    console.log(`   Status: ${res.statusCode}`);
    if (res.statusCode === 302) {
      console.log('   ✅ Google Auth endpoint is working (302 redirect expected)');
    } else {
      console.log('   ❌ Google Auth endpoint is not working correctly');
    }
    
    console.log('\n🎯 Deployment Status:');
    console.log('   - If both tests pass, the deployment was successful');
    console.log('   - Try Google Auth login now to test the new flow');
    console.log('   - New users should be redirected to payment page');
    console.log('   - Returning users with active subscriptions should go to dashboard');
  }).on('error', (err) => {
    console.log('   ❌ Error testing Google Auth endpoint:', err.message);
  });
}).on('error', (err) => {
  console.log('   ❌ Error testing API health:', err.message);
});
