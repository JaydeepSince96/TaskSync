const mongoose = require('mongoose');
const User = require('./dist/models/user-model').default;
const subscriptionService = require('./dist/services/subscription-service').default;

async function testTrialEligibility() {
  console.log('🧪 Testing Trial Eligibility System...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tasksync');
    console.log('✅ Connected to MongoDB');
    
    const subscriptionService = require('./dist/services/subscription-service').default;
    
    // Test email that might have been used before
    const testEmail = 'test@example.com';
    
    // Check if any user with this email has used trial
    console.log(`\n📧 Checking trial eligibility for email: ${testEmail}`);
    
    const isEligible = await subscriptionService.isEligibleForTrial(testEmail);
    console.log(`🎯 Trial eligible: ${isEligible}`);
    
    // Get user details for this email
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log(`👤 User found: ${existingUser.name}`);
      console.log(`📅 Has used trial: ${existingUser.hasUsedFreeTrial}`);
      console.log(`🕒 Trial used at: ${existingUser.trialUsedAt || 'Never'}`);
    } else {
      console.log(`❌ No user found with email: ${testEmail}`);
    }
    
    // Test with a new email that should be eligible
    const newEmail = `test-${Date.now()}@example.com`;
    console.log(`\n📧 Checking trial eligibility for new email: ${newEmail}`);
    
    const newIsEligible = await subscriptionService.isEligibleForTrial(newEmail);
    console.log(`🎯 Trial eligible: ${newIsEligible}`);
    
    // Show all users and their trial status
    console.log('\n📊 Current Users Trial Status:');
    const allUsers = await User.find({}, 'name email hasUsedFreeTrial trialUsedAt');
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   - Has used trial: ${user.hasUsedFreeTrial}`);
      console.log(`   - Trial used at: ${user.trialUsedAt || 'Never'}`);
      console.log('');
    });
    
    console.log('🎉 Trial eligibility test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing trial eligibility:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Load environment variables
require('dotenv').config();

// Run the test
testTrialEligibility();
