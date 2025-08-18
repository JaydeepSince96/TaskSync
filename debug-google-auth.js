// Debug script to check Google Auth deployment details
const https = require('https');

console.log('🔍 Detailed Google Auth Debug...\n');

// Test 1: Check API version/build info
console.log('1️⃣ Checking API build info...');
https.get('https://api.tasksync.org/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Response: ${data}`);
    
    // Test 2: Check if our debug logs are present
    console.log('\n2️⃣ Checking for debug logs in recent deployment...');
    console.log('   - Look for these log messages in AWS:');
    console.log('   - "Google OAuth: User exists:"');
    console.log('   - "Google OAuth: First time using Google Auth for existing user"');
    console.log('   - "Google OAuth: Creating new user"');
    console.log('   - "Google callback: Redirecting to payment page"');
    
    // Test 3: Check Google Auth endpoint headers
    console.log('\n3️⃣ Checking Google Auth endpoint...');
    const req = https.get('https://api.tasksync.org/api/auth/google', (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      if (res.statusCode === 302) {
        console.log('   ✅ Google Auth endpoint is working');
        console.log(`   Redirect Location: ${res.headers.location}`);
      } else {
        console.log('   ❌ Google Auth endpoint issue');
      }
    });
    
    req.on('error', (err) => {
      console.log('   ❌ Error:', err.message);
    });
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Try Google Auth with a NEW email address');
    console.log('2. Check AWS logs immediately after the attempt');
    console.log('3. Look for our debug messages in the logs');
    console.log('4. Share the logs if the issue persists');
  });
}).on('error', (err) => {
  console.log('   ❌ Error:', err.message);
});
