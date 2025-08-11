#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('🔍 Testing HTTPS with curl...\n');

const urls = [
  'https://tasksync.ap-south-1.elasticbeanstalk.com/health',
  'https://api.tasksync.org/health',
  'https://tasksync.ap-south-1.elasticbeanstalk.com/api/health',
  'https://api.tasksync.org/api/health'
];

async function testUrlWithCurl(url) {
  try {
    console.log(`🔍 Testing: ${url}`);
    
    // Use curl with verbose output and ignore SSL verification for testing
    const command = `curl -k -v -m 10 "${url}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    console.log(`   ✅ Response:`, stdout.substring(0, 200) + '...');
    if (stderr) {
      console.log(`   📋 Debug Info:`, stderr.substring(0, 300) + '...');
    }
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    if (error.stderr) {
      console.log(`   📋 Debug Info:`, error.stderr.substring(0, 300) + '...');
    }
  }
  
  return false;
}

async function testAllUrls() {
  console.log('🚀 Testing HTTPS endpoints with curl...\n');
  
  for (const url of urls) {
    const success = await testUrlWithCurl(url);
    if (success) {
      console.log(`\n🎉 WORKING ENDPOINT: ${url}`);
      break;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('\n📋 Analysis:');
  console.log('   - If curl works, it\'s a Node.js fetch issue');
  console.log('   - If curl fails, it\'s an SSL/HTTPS configuration issue');
  console.log('   - Check Elastic Beanstalk Load Balancer HTTPS configuration');
}

testAllUrls();
