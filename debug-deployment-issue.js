// Comprehensive debug script to identify deployment issues
const https = require('https');

console.log('🔍 Comprehensive Deployment Debug...\n');

// Test 1: Check if the API is running at all
console.log('1️⃣ Testing API Health...');
https.get('https://api.tasksync.org/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Response: ${data}`);
    
    if (res.statusCode === 200) {
      console.log('   ✅ API is running');
      
      // Test 2: Check if our specific files are accessible
      console.log('\n2️⃣ Testing if our changes are deployed...');
      console.log('   - The 500 error suggests a compilation or runtime error');
      console.log('   - This could be due to:');
      console.log('     a) Missing dependencies');
      console.log('     b) TypeScript compilation errors');
      console.log('     c) Missing environment variables');
      console.log('     d) Incorrect file structure in deployment');
      
      // Test 3: Check if the deployment included all necessary files
      console.log('\n3️⃣ Possible Deployment Issues:');
      console.log('   - Did you include the `src/` folder in the deployment?');
      console.log('   - Did you include `package.json` and `package-lock.json`?');
      console.log('   - Did you run `npm install` on the server?');
      console.log('   - Are there any TypeScript compilation errors?');
      
      console.log('\n4️⃣ Next Steps to Fix:');
      console.log('   1. Check AWS logs for specific error messages');
      console.log('   2. Ensure all files are included in deployment package');
      console.log('   3. Verify TypeScript compilation is successful');
      console.log('   4. Check if all dependencies are installed');
      
    } else {
      console.log('   ❌ API is not responding correctly');
    }
  });
}).on('error', (err) => {
  console.log('   ❌ Error:', err.message);
});

console.log('\n🎯 Immediate Actions Required:');
console.log('1. Check AWS Elastic Beanstalk logs for specific error messages');
console.log('2. Look for TypeScript compilation errors');
console.log('3. Verify that all files were included in the deployment package');
console.log('4. Check if the deployment package structure is correct');
