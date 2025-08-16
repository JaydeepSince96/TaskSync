const fetch = require('node-fetch');

async function testContactAPI() {
  console.log('🧪 Testing Contact API...');
  
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Message',
    message: 'This is a test message from the contact form.'
  };

  try {
    const response = await fetch('http://localhost:5000/api/contact/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Contact API test PASSED!');
    } else {
      console.log('❌ Contact API test FAILED!');
    }
  } catch (error) {
    console.error('❌ Error testing Contact API:', error.message);
  }
}

// Run the test
testContactAPI();
