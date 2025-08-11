#!/usr/bin/env node

console.log('🔍 Getting AWS Elastic Beanstalk IP Address...\n');

async function getAWSIP() {
  try {
    console.log('📡 Fetching current IP from AWS...');
    
    // Method 1: Get public IP
    const response = await fetch('http://169.254.169.254/latest/meta-data/public-ipv4');
    if (response.ok) {
      const ip = await response.text();
      console.log('✅ AWS Public IP:', ip);
      console.log('\n📋 Add this to MongoDB Atlas:');
      console.log(`   IP Address: ${ip}/32`);
      console.log(`   Description: AWS Elastic Beanstalk - ${new Date().toISOString()}`);
      return ip;
    }
  } catch (error) {
    console.log('❌ Could not get IP from AWS metadata service');
  }

  try {
    // Method 2: Get from external service
    console.log('📡 Fetching IP from external service...');
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Current Public IP:', data.ip);
      console.log('\n📋 Add this to MongoDB Atlas:');
      console.log(`   IP Address: ${data.ip}/32`);
      console.log(`   Description: AWS Elastic Beanstalk - ${new Date().toISOString()}`);
      return data.ip;
    }
  } catch (error) {
    console.log('❌ Could not get IP from external service');
  }

  console.log('\n⚠️  Could not determine IP automatically.');
  console.log('📋 Manual steps:');
  console.log('   1. Go to AWS Console → Elastic Beanstalk');
  console.log('   2. Select your environment');
  console.log('   3. Go to Configuration → Instances');
  console.log('   4. Note the public IP address');
  console.log('   5. Add that IP/32 to MongoDB Atlas');
}

getAWSIP();
