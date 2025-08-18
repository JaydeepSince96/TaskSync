// Test to check if our specific changes are deployed
const https = require('https');

console.log('🔍 Testing if our changes are deployed...\n');

// Test 1: Check if our debug messages are in the code
console.log('1️⃣ Testing Google Auth callback...');
console.log('   - If our changes are deployed, we should see debug messages');
console.log('   - If not deployed, we\'ll get the old behavior');
console.log('');

// Test 2: Try to trigger our debug logic
console.log('2️⃣ Instructions to test:');
console.log('   1. Try Google Auth with a NEW email address');
console.log('   2. Check AWS logs immediately after');
console.log('   3. Look for these debug messages:');
console.log('      - "Google OAuth: User exists:"');
console.log('      - "Google OAuth: Creating new user"');
console.log('      - "Google callback: Redirecting to payment page"');
console.log('   4. If you see these messages, our changes are deployed');
console.log('   5. If you don\'t see these messages, there\'s a caching issue');
console.log('');

// Test 3: Check current behavior
console.log('3️⃣ Current Behavior Check:');
console.log('   - URL after Google Auth: tasksync.org/login?error=auth_failed');
console.log('   - This means old code is still running');
console.log('   - Expected URL: tasksync.org/payment?auth=success&new_user=true');
console.log('');

console.log('4️⃣ Immediate Actions:');
console.log('   A. Go to AWS EB Console → Actions → Restart app server(s)');
console.log('   B. Wait 2-3 minutes for restart');
console.log('   C. Try Google Auth again');
console.log('   D. Check AWS logs for debug messages');
console.log('');

console.log('5️⃣ If restart doesn\'t work:');
console.log('   A. Go to Application versions');
console.log('   B. Create new version with timestamp');
console.log('   C. Deploy new version');
console.log('   D. Test again');
console.log('');

console.log('🎯 The key is checking AWS logs for our debug messages!');
console.log('   - If you see them: Changes are deployed');
console.log('   - If you don\'t: Caching issue exists');
