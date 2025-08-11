#!/usr/bin/env node

console.log('🔍 Testing HTTPS URLs...\n');

const urls = [
  'https://tasksync.ap-south-1.elasticbeanstalk.com',
  'https://api.tasksync.org',
  'https://www.tasksync.org'
];

async function testUrl(url) {
  try {
    console.log(`🔍 Testing: ${url}`);
    
    // Test health endpoint
    const healthResponse = await fetch(`${url}/api/health`);
    console.log(`   Health Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   ✅ Health:`, healthData);
    } else {
      const healthText = await healthResponse.text();
      console.log(`   ❌ Health Error:`, healthText.substring(0, 100) + '...');
    }
    
    // Test CORS endpoint
    const corsResponse = await fetch(`${url}/api/cors-test`);
    console.log(`   CORS Status: ${corsResponse.status}`);
    
    if (corsResponse.ok) {
      const corsData = await corsResponse.json();
      console.log(`   ✅ CORS:`, corsData);
      return true;
    } else {
      const corsText = await corsResponse.text();
      console.log(`   ❌ CORS Error:`, corsText.substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
  }
  
  return false;
}

async function testAllUrls() {
  console.log('🚀 Testing all HTTPS URLs...\n');
  
  for (const url of urls) {
    const success = await testUrl(url);
    if (success) {
      console.log(`\n🎉 WORKING URL: ${url}`);
      console.log('\n📋 Use this URL for your frontend API calls!');
      break;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('\n📋 Summary:');
  console.log('   - Use HTTPS instead of HTTP');
  console.log('   - Your Elastic Beanstalk environment requires HTTPS');
  console.log('   - This is a security feature, not a bug');
}

testAllUrls();
