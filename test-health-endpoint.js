#!/usr/bin/env node

console.log('🔍 Testing Health Endpoint...\n');

const urls = [
  'https://api.tasksync.org/health',
  'https://api.tasksync.org/api/health',
  'https://api.tasksync.org/',
  'https://tasksync.ap-south-1.elasticbeanstalk.com/health',
  'https://tasksync.ap-south-1.elasticbeanstalk.com/api/health'
];

async function testUrl(url) {
  try {
    console.log(`🔍 Testing: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.text();
      console.log(`   ✅ Response:`, data.substring(0, 200) + '...');
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error:`, errorText.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
  }
  
  return false;
}

async function testAllUrls() {
  console.log('🚀 Testing all health endpoints...\n');
  
  for (const url of urls) {
    const success = await testUrl(url);
    if (success) {
      console.log(`\n🎉 WORKING ENDPOINT: ${url}`);
      break;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('\n📋 Analysis:');
  console.log('   - If all endpoints fail, the server is not responding');
  console.log('   - If some work, there might be a routing issue');
  console.log('   - Check if the application is actually running');
}

testAllUrls();
