#!/usr/bin/env node

const https = require('https');

// Test CORS configuration
async function testCORS() {
  console.log('🔍 Testing CORS Configuration...\n');

  const tests = [
    {
      name: 'Health Check',
      url: 'https://api.tasksync.org/api/health',
      method: 'GET'
    },
    {
      name: 'CORS Test Endpoint',
      url: 'https://api.tasksync.org/api/cors-test',
      method: 'GET',
      headers: {
        'Origin': 'http://tasksync-fe-bucket.s3-website.ap-south-1.amazonaws.com'
      }
    },
    {
      name: 'Login Endpoint (OPTIONS)',
      url: 'https://api.tasksync.org/api/auth/login',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://tasksync-fe-bucket.s3-website.ap-south-1.amazonaws.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    }
  ];

  for (const test of tests) {
    console.log(`📋 Testing: ${test.name}`);
    console.log(`🌐 URL: ${test.url}`);
    console.log(`📤 Method: ${test.method}`);
    
    if (test.headers) {
      console.log(`📋 Headers:`, test.headers);
    }
    
    try {
      const result = await makeRequest(test.url, test.method, test.headers);
      console.log(`✅ Status: ${result.status}`);
      console.log(`📄 Response:`, JSON.stringify(result.data, null, 2));
      
      // Check for CORS headers
      if (result.headers['access-control-allow-origin']) {
        console.log(`✅ CORS Header: ${result.headers['access-control-allow-origin']}`);
      } else {
        console.log(`⚠️  No CORS header found`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('─'.repeat(50));
  }
}

function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'CORS-Test-Script/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Run the test
testCORS().catch(console.error);