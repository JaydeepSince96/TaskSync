// Test subscription service functionality
const https = require('https');

console.log('🔍 Testing Subscription Service...\n');

// Test 1: Check if subscription-related endpoints are working
console.log('1️⃣ Testing subscription endpoints...');

// Test subscription status endpoint (if it exists)
const testSubscriptionUrl = 'https://api.tasksync.org/api/subscription/status';

https.get(testSubscriptionUrl, (res) => {
  console.log(`   Status: ${res.statusCode}`);
  
  if (res.statusCode === 200 || res.statusCode === 401) {
    console.log('   ✅ Subscription endpoint is responding');
  } else if (res.statusCode === 404) {
    console.log('   ⚠️  Subscription endpoint not found (this might be normal)');
  } else {
    console.log('   ❌ Subscription endpoint error');
  }
  
  console.log('\n🎯 Analysis:');
  console.log('   - If subscription service is working, the Google Auth should work');
  console.log('   - The 500 error might be due to a different issue');
  console.log('   - Let\'s check the AWS logs for specific error messages');
  
}).on('error', (err) => {
  console.log('   ❌ Error:', err.message);
  console.log('\n🎯 This is expected if subscription endpoint doesn\'t exist');
  console.log('   The important thing is to check AWS logs for the actual error');
});

console.log('\n2️⃣ Next Steps:');
console.log('   1. Check AWS Elastic Beanstalk logs for specific error messages');
console.log('   2. Look for any runtime errors in the logs');
console.log('   3. Check if there are any missing environment variables');
console.log('   4. Verify that all dependencies are installed on the server');
