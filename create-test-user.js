// Simple script to create a test user for login debugging
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/task-manager'; // Update if different

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isEmailVerified: { type: Boolean, default: true },
  refreshTokens: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists:');
      console.log(`Email: test@example.com`);
      console.log(`Password: password123`);
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      isEmailVerified: true
    });

    await testUser.save();
    console.log('Test user created successfully!');
    console.log('Login credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUser();
