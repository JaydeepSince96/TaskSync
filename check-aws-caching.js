// Check for AWS caching issues
const https = require('https');

console.log('🔍 Checking for AWS Caching Issues...\n');

// Test 1: Check if there are multiple versions deployed
console.log('1️⃣ Common AWS Caching Issues:');
console.log('   - Application version caching');
console.log('   - Load balancer caching');
console.log('   - CDN caching (if using CloudFront)');
console.log('   - Browser caching');
console.log('   - Node.js module caching');
console.log('   - Environment variable caching');
console.log('');

// Test 2: Check deployment timestamp
console.log('2️⃣ Checking deployment timestamp...');
https.get('https://api.tasksync.org/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const healthData = JSON.parse(data);
      console.log(`   Current server timestamp: ${healthData.timestamp}`);
      
      // Check if this is recent
      const serverTime = new Date(healthData.timestamp);
      const now = new Date();
      const diffMinutes = Math.abs(now - serverTime) / (1000 * 60);
      
      if (diffMinutes < 5) {
        console.log('   ✅ Server time is recent (deployment likely active)');
      } else {
        console.log('   ⚠️  Server time might be cached');
      }
    } catch (error) {
      console.log('   ❌ Could not parse health response');
    }
  });
}).on('error', (err) => {
  console.log('   ❌ Error:', err.message);
});

console.log('\n3️⃣ AWS Caching Solutions:');
console.log('   A. Force New Application Version:');
console.log('      1. Go to AWS Elastic Beanstalk Console');
console.log('      2. Select your environment');
console.log('      3. Go to "Application versions"');
console.log('      4. Create a new version with a different label');
console.log('      5. Deploy the new version');
console.log('');
console.log('   B. Clear Load Balancer Cache:');
console.log('      1. Go to EC2 Console > Load Balancers');
console.log('      2. Find your EB load balancer');
console.log('      3. Check if there are any caching policies');
console.log('      4. Temporarily disable caching if present');
console.log('');
console.log('   C. Force Environment Restart:');
console.log('      1. Go to EB Console');
console.log('      2. Select your environment');
console.log('      3. Click "Actions" > "Restart app server(s)"');
console.log('      4. Wait for restart to complete');
console.log('');
console.log('   D. Check for Multiple Instances:');
console.log('      1. Go to EC2 Console');
console.log('      2. Look for multiple instances in your EB environment');
console.log('      3. Ensure all instances are updated');
console.log('');
console.log('   E. Environment Variable Issues:');
console.log('      1. Check if environment variables are cached');
console.log('      2. Try updating an environment variable');
console.log('      3. This forces a new deployment');
console.log('');

console.log('4️⃣ Immediate Action Plan:');
console.log('   1. Create a new application version with timestamp');
console.log('   2. Restart the app server(s)');
console.log('   3. Check if multiple instances exist');
console.log('   4. Verify environment variables');
console.log('   5. Test Google Auth again');
console.log('');

console.log('🎯 Most Likely Issue:');
console.log('   - The deployment created a new version but the old version is still running');
console.log('   - Solution: Force a new application version deployment');
