#!/usr/bin/env node

console.log('🔍 Testing Direct Elastic Beanstalk URL...\n');

const urls = [
  'http://tasksync.ap-south-1.elasticbeanstalk.com/health',
  'http://tasksync.ap-south-1.elasticbeanstalk.com/api/health',
  'http://tasksync.ap-south-1.elasticbeanstalk.com/',
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
  console.log('🚀 Testing direct Elastic Beanstalk URLs...\n');
  
  for (const url of urls) {
    const success = await testUrl(url);
    if (success) {
      console.log(`\n🎉 WORKING ENDPOINT: ${url}`);
      break;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('\n📋 Analysis:');
  console.log('   - If HTTP works but HTTPS doesn\'t, it\'s an SSL issue');
  console.log('   - If none work, there\'s a routing issue');
  console.log('   - If some work, the custom domain might be the problem');
}

testAllUrls();
