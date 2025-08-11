#!/usr/bin/env node

console.log('🔍 DNS Diagnostic Tool\n');

const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

const domains = [
  'tasksync.ap-south-1.elasticbeanstalk.com',
  'api.tasksync.org',
  'www.tasksync.org',
  'tasksync.org'
];

async function checkDNS(domain) {
  console.log(`🔍 Checking DNS for: ${domain}`);
  
  try {
    // Check A records (IPv4)
    const aRecords = await resolve4(domain);
    console.log(`   ✅ A Records:`, aRecords);
    
    // Check CNAME records
    try {
      const cnameRecords = await resolveCname(domain);
      console.log(`   ✅ CNAME Records:`, cnameRecords);
    } catch (error) {
      console.log(`   ℹ️  No CNAME records found`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ DNS Resolution Failed:`, error.message);
    return false;
  }
}

async function runDNSDiagnostic() {
  console.log('🚀 Running DNS diagnostics...\n');
  
  for (const domain of domains) {
    const success = await checkDNS(domain);
    console.log(`   Status: ${success ? '✅ Resolved' : '❌ Failed'}\n`);
  }
  
  console.log('📋 DNS Analysis:');
  console.log('   - If A records exist, DNS is working');
  console.log('   - If DNS fails, check your domain configuration');
  console.log('   - CNAME records show domain redirects');
}

runDNSDiagnostic();
