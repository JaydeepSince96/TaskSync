#!/usr/bin/env node

console.log('🔍 Getting VPC CIDR Blocks for MongoDB Atlas...\n');

async function getVPCCIDR() {
  try {
    console.log('📡 Fetching VPC information from AWS...');
    
    // Get VPC ID
    const vpcResponse = await fetch('http://169.254.169.254/latest/meta-data/network/interfaces/macs/');
    if (vpcResponse.ok) {
      const macs = await vpcResponse.text();
      const mac = macs.split('\n')[0]; // Get first MAC address
      
      // Get VPC ID from MAC
      const vpcResponse2 = await fetch(`http://169.254.169.254/latest/meta-data/network/interfaces/macs/${mac}/vpc-ipv4-cidr-block`);
      if (vpcResponse2.ok) {
        const vpcCidr = await vpcResponse2.text();
        console.log('✅ VPC CIDR Block:', vpcCidr);
        console.log('\n📋 Add this to MongoDB Atlas:');
        console.log(`   IP Address: ${vpcCidr}`);
        console.log(`   Description: AWS VPC CIDR - ${new Date().toISOString()}`);
        return vpcCidr;
      }
    }
  } catch (error) {
    console.log('❌ Could not get VPC CIDR from AWS metadata service');
  }

  console.log('\n⚠️  Could not determine VPC CIDR automatically.');
  console.log('📋 Manual steps to get VPC CIDR:');
  console.log('   1. Go to AWS Console → VPC');
  console.log('   2. Select your VPC');
  console.log('   3. Note the CIDR block (e.g., 172.31.0.0/16)');
  console.log('   4. Add that CIDR to MongoDB Atlas');
  console.log('\n📋 For multiple subnets:');
  console.log('   1. Go to AWS Console → VPC → Subnets');
  console.log('   2. Note CIDR blocks for each subnet');
  console.log('   3. Add each CIDR to MongoDB Atlas');
  console.log('\n📋 Common VPC CIDR patterns:');
  console.log('   - 172.31.0.0/16 (Default VPC)');
  console.log('   - 10.0.0.0/16 (Custom VPC)');
  console.log('   - 192.168.0.0/16 (Custom VPC)');
}

getVPCCIDR();
