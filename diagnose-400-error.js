#!/usr/bin/env node

console.log('🔍 Diagnosing 400 Error on Elastic Beanstalk...\n');

async function diagnose400Error() {
  const baseUrl = 'https://tasksync.ap-south-1.elasticbeanstalk.com';
  
  console.log('📡 Testing endpoints...\n');
  
  // Test 1: Root endpoint
  try {
    console.log('🔍 Test 1: Root endpoint (/)');
    const response = await fetch(`${baseUrl}/`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success:`, data);
    } else {
      const text = await response.text();
      console.log(`   ❌ Error:`, text);
    }
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
  }
  
  // Test 2: Health endpoint
  try {
    console.log('\n🔍 Test 2: Health endpoint (/health)');
    const response = await fetch(`${baseUrl}/health`);
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success:`, data);
    } else {
      const text = await response.text();
      console.log(`   ❌ Error:`, text);
    }
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
  }
  
  // Test 3: API health endpoint
  try {
    console.log('\n🔍 Test 3: API health endpoint (/api/health)');
    const response = await fetch(`${baseUrl}/api/health`);
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success:`, data);
    } else {
      const text = await response.text();
      console.log(`   ❌ Error:`, text);
    }
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
  }
  
  // Test 4: CORS test endpoint
  try {
    console.log('\n🔍 Test 4: CORS test endpoint (/api/cors-test)');
    const response = await fetch(`${baseUrl}/api/cors-test`);
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success:`, data);
    } else {
      const text = await response.text();
      console.log(`   ❌ Error:`, text);
    }
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
  }
  
  console.log('\n📋 Possible Causes of 400 Error:');
  console.log('   1. Missing environment variables');
  console.log('   2. Application not starting properly');
  console.log('   3. Port binding issues');
  console.log('   4. Database connection problems');
  console.log('   5. Middleware errors');
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. Check AWS Elastic Beanstalk logs');
  console.log('   2. Verify environment variables are set');
  console.log('   3. Check if MongoDB connection is working');
  console.log('   4. Look for application startup errors');
}

diagnose400Error();
