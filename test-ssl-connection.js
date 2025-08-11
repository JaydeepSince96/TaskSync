#!/usr/bin/env node

console.log('🔍 Testing SSL/TLS Connections...\n');

const https = require('https');

const urls = [
  'tasksync.ap-south-1.elasticbeanstalk.com',
  'api.tasksync.org'
];

async function testSSLConnection(hostname) {
  console.log(`🔍 Testing SSL for: ${hostname}`);
  
  return new Promise((resolve) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: '/api/health',
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: false // Allow self-signed certificates for testing
    };

    const req = https.request(options, (res) => {
      console.log(`   ✅ SSL Status: ${res.statusCode}`);
      console.log(`   ✅ Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   ✅ Response:`, data.substring(0, 200) + '...');
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ SSL Error:`, error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`   ❌ SSL Timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runSSLTest() {
  console.log('🚀 Testing SSL connections...\n');
  
  for (const hostname of urls) {
    const success = await testSSLConnection(hostname);
    console.log(`   Overall Status: ${success ? '✅ Working' : '❌ Failed'}\n`);
  }
  
  console.log('📋 SSL Analysis:');
  console.log('   - If SSL works, the issue is in the application');
  console.log('   - If SSL fails, there might be certificate issues');
  console.log('   - 503 errors indicate application problems, not SSL');
}

runSSLTest();
