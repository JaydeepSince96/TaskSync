// migration-trial-tracking.js
// Migration script to add trial tracking fields to existing users
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/TaskSync';

async function migrateTirialTracking() {
    const client = new MongoClient(MONGO_URI);
    
    try {
        console.log('🚀 Starting trial tracking migration...');
        await client.connect();
        const db = client.db();
        
        // Update existing users without trial tracking fields
        const result = await db.collection('users').updateMany(
            { 
                $or: [
                    { hasUsedFreeTrial: { $exists: false } },
                    { hasUsedFreeTrial: null }
                ]
            },
            {
                $set: {
                    hasUsedFreeTrial: false,
                    trialUsedAt: null
                }
            }
        );
        
        console.log(`✅ Updated ${result.modifiedCount} users with trial tracking fields`);
        
        // Check for users who already have trial subscriptions and mark them
        const trialSubscriptions = await db.collection('subscriptions').find({
            plan: 'trial',
            status: { $in: ['active', 'trial', 'expired', 'cancelled'] }
        }).toArray();
        
        console.log(`📊 Found ${trialSubscriptions.length} existing trial subscriptions`);
        
        let updatedTrialUsers = 0;
        for (const subscription of trialSubscriptions) {
            const updateResult = await db.collection('users').updateOne(
                { _id: subscription.userId },
                {
                    $set: {
                        hasUsedFreeTrial: true,
                        trialUsedAt: subscription.startDate || subscription.createdAt || new Date()
                    }
                }
            );
            
            if (updateResult.modifiedCount > 0) {
                updatedTrialUsers++;
            }
        }
        
        console.log(`✅ Updated ${updatedTrialUsers} users who had existing trial subscriptions`);
        
        // Summary
        console.log('\n📈 Migration Summary:');
        console.log(`   - Users updated with trial fields: ${result.modifiedCount}`);
        console.log(`   - Users marked as trial used: ${updatedTrialUsers}`);
        console.log(`   - Total trial subscriptions found: ${trialSubscriptions.length}`);
        
        console.log('\n🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        process.exit(0);
    }
}

// Run migration
migrateTirialTracking();
