// Test script to debug Google Auth callback flow
const https = require('https');

console.log('🔍 Testing Google Auth Callback Flow...\n');

// Test 1: Check what happens when we access the callback URL directly
console.log('1️⃣ Testing Google Auth callback endpoint...');
console.log('   This will help us understand if the backend is working correctly');

// Simulate a callback URL (this will fail, but we can see the response)
const testCallbackUrl = 'https://api.tasksync.org/api/auth/google/callback?code=test_code&scope=email+profile&authuser=1&prompt=none';

https.get(testCallbackUrl, (res) => {
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  if (res.statusCode === 302) {
    console.log('   ✅ Callback is redirecting (expected)');
    console.log(`   Redirect Location: ${res.headers.location}`);
    
    // Check if it's redirecting to the correct frontend URL
    if (res.headers.location && res.headers.location.includes('tasksync.org')) {
      console.log('   ✅ Redirecting to correct frontend domain');
    } else {
      console.log('   ❌ Redirecting to wrong domain');
    }
  } else {
    console.log('   ❌ Callback is not redirecting as expected');
  }
  
  console.log('\n🎯 Analysis:');
  console.log('   - If status is 302, the backend is working');
  console.log('   - Check the redirect location to see where it goes');
  console.log('   - If it goes to /login?error=auth_failed, our changes are not deployed');
  console.log('   - If it goes to /payment?auth=success&new_user=true, our changes are working');
  
}).on('error', (err) => {
  console.log('   ❌ Error:', err.message);
  console.log('\n🎯 This is expected - the callback requires a valid Google OAuth code');
  console.log('   The important thing is to check the AWS logs when you try Google Auth');
});

console.log('\n2️⃣ Next Steps:');
console.log('   1. Try Google Auth with a NEW email address');
console.log('   2. Check AWS logs immediately after the attempt');
console.log('   3. Look for these debug messages in the logs:');
console.log('      - "Google OAuth: User exists:"');
console.log('      - "Google OAuth: First time using Google Auth for existing user"');
console.log('      - "Google OAuth: Creating new user"');
console.log('      - "Google callback: Redirecting to payment page"');
console.log('   4. If you see these messages, the backend is working correctly');
console.log('   5. If you don\'t see these messages, the changes are not deployed');
