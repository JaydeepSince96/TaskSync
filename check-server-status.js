#!/usr/bin/env node

console.log('🔍 Checking Server Status...\n');

async function checkServerStatus() {
  const apiUrl = 'https://api.tasksync.org';
  
  console.log(`📡 Testing API: ${apiUrl}`);
  
  try {
    const response = await fetch(`${apiUrl}/api/health`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 503) {
      console.log('\n🚨 SERVER IS DOWN (503)');
      console.log('\n📋 This means:');
      console.log('   1. Application crashed or failed to start');
      console.log('   2. MongoDB connection is still failing');
      console.log('   3. Environment variables are missing');
      console.log('   4. Port binding issues');
      
      console.log('\n🔧 Immediate Actions:');
      console.log('   1. Go to AWS Console → Elastic Beanstalk');
      console.log('   2. Check environment health status');
      console.log('   3. View recent application logs');
      console.log('   4. Verify MongoDB Atlas IP whitelist');
      console.log('   5. Check environment variables');
      
      console.log('\n📋 Most Likely Cause:');
      console.log('   MongoDB Atlas IP whitelist - Add 3.110.145.15/32');
      
    } else if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Server is running:`, data);
    } else {
      const text = await response.text();
      console.log(`   ❌ Error:`, text);
    }
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
    console.log('\n🚨 Cannot reach server');
    console.log('\n📋 Possible causes:');
    console.log('   1. Server is completely down');
    console.log('   2. DNS resolution issues');
    console.log('   3. Network connectivity problems');
  }
}

checkServerStatus();
