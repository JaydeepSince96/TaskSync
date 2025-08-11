#!/usr/bin/env node

console.log('🔍 Testing All Possible URLs...\n');

const urls = [
  'http://tasksync.ap-south-1.elasticbeanstalk.com',
  'https://tasksync.ap-south-1.elasticbeanstalk.com',
  'http://api.tasksync.org',
  'https://api.tasksync.org',
  'http://www.tasksync.org',
  'https://www.tasksync.org'
];

async function testUrl(url) {
  try {
    console.log(`🔍 Testing: ${url}`);
    const response = await fetch(`${url}/api/health`);
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS:`, data);
      return true;
    } else {
      const text = await response.text();
      console.log(`   ❌ Error:`, text.substring(0, 100) + '...');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
    return false;
  }
}

async function testAllUrls() {
  console.log('🚀 Testing all possible URLs...\n');
  
  for (const url of urls) {
    const success = await testUrl(url);
    if (success) {
      console.log(`\n🎉 FOUND WORKING URL: ${url}`);
      console.log('\n📋 Use this URL for your frontend API calls!');
      break;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('\n🔧 If no URL works, check:');
  console.log('   1. AWS Elastic Beanstalk environment status');
  console.log('   2. Application logs for startup errors');
  console.log('   3. MongoDB connection status');
  console.log('   4. Environment variables');
}

testAllUrls();
