const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tasksync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the Subtask schema directly for migration
const subtaskSchema = new mongoose.Schema({
  title: String,
  completed: Boolean,
  taskId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const Subtask = mongoose.model('Subtask', subtaskSchema);

async function migrateSubtasks() {
  try {
    console.log('🔄 Starting migration: Adding completedAt field to subtasks...');
    
    // Get all completed subtasks that don't have completedAt field
    const completedSubtasks = await Subtask.find({
      completed: true,
      completedAt: { $exists: false }
    });
    
    console.log(`📊 Found ${completedSubtasks.length} completed subtasks without completedAt field`);
    
    if (completedSubtasks.length === 0) {
      console.log('✅ No subtasks need migration');
      return;
    }
    
    // Update each subtask to set completedAt to updatedAt (best approximation)
    let updatedCount = 0;
    for (const subtask of completedSubtasks) {
      try {
        await Subtask.updateOne(
          { _id: subtask._id },
          { 
            $set: { 
              completedAt: subtask.updatedAt || subtask.createdAt 
            } 
          }
        );
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`📈 Updated ${updatedCount}/${completedSubtasks.length} subtasks...`);
        }
      } catch (error) {
        console.error(`❌ Error updating subtask ${subtask._id}:`, error.message);
      }
    }
    
    console.log(`✅ Migration completed! Updated ${updatedCount} subtasks`);
    
    // Verify the migration
    const remainingSubtasks = await Subtask.find({
      completed: true,
      completedAt: { $exists: false }
    });
    
    console.log(`🔍 Verification: ${remainingSubtasks.length} subtasks still missing completedAt field`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateSubtasks();
