// Test Razorpay Configuration
require('dotenv').config();
const Razorpay = require('razorpay');

async function testRazorpayConfig() {
  console.log('🧪 Testing Razorpay Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`RAZORPAY_KEY_SECRET: ${process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.log('\n❌ Razorpay credentials not found in environment variables');
    return;
  }
  
  try {
    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    console.log('\n✅ Razorpay instance created successfully');
    
    // Test order creation
    console.log('\n🔄 Testing order creation...');
    
    const order = await razorpay.orders.create({
      amount: 19900, // ₹199.00 in paise
      currency: 'INR',
      payment_capture: true,
      notes: {
        purpose: 'test_order'
      }
    });
    
    console.log('✅ Test order created successfully!');
    console.log(`📦 Order ID: ${order.id}`);
    console.log(`💰 Amount: ₹${order.amount / 100}`);
    console.log(`💸 Currency: ${order.currency}`);
    console.log(`📅 Created: ${new Date(order.created_at * 1000).toLocaleString()}`);
    
    console.log('\n🎉 Razorpay configuration is working correctly!');
    console.log('\n💡 Now you can test payments in your application.');
    
  } catch (error) {
    console.error('\n❌ Razorpay configuration error:');
    console.error('Error message:', error.message);
    
    if (error.statusCode === 400) {
      console.error('🔍 This usually means invalid credentials or insufficient permissions');
    } else if (error.statusCode === 401) {
      console.error('🔍 Authentication failed - check your KEY_ID and KEY_SECRET');
    }
  }
}

testRazorpayConfig();
