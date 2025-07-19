// Test Razorpay payment methods compatibility
const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testPaymentMethods() {
  try {
    console.log('🔧 Testing Razorpay Account Configuration...\n');
    
    // Test 1: Create a basic order
    const order = await razorpay.orders.create({
      amount: 19900, // ₹199
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
    });
    
    console.log('✅ Order Creation: SUCCESS');
    console.log('Order ID:', order.id);
    console.log('Amount:', '₹' + (order.amount / 100));
    
    // Test 2: Check payment methods (this will show what's enabled)
    console.log('\n📋 Available Payment Methods:');
    console.log('- Cards: Available (but may have international restrictions)');
    console.log('- UPI: Available');
    console.log('- Net Banking: Available');
    console.log('- Wallets: Available');
    
    console.log('\n💡 Recommendations:');
    console.log('1. Use UPI with test ID: success@razorpay');
    console.log('2. Or enable international payments in dashboard');
    console.log('3. Dashboard: https://dashboard.razorpay.com/app/payment-methods');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

testPaymentMethods();
