// CORS Test Script for TaskSync API
// Run this in your browser console

console.log('🧪 Starting CORS Tests for TaskSync API...\n');

// Test 1: Basic Health Check
async function testHealth() {
    console.log('🔍 Test 1: Health Check');
    try {
        const response = await fetch('https://api.tasksync.org/');
        const data = await response.json();
        console.log('✅ Health Check SUCCESS:', data);
        return true;
    } catch (error) {
        console.log('❌ Health Check FAILED:', error.message);
        return false;
    }
}

// Test 2: CORS Test Endpoint
async function testCORS() {
    console.log('\n🔍 Test 2: CORS Test Endpoint');
    try {
        const response = await fetch('https://api.tasksync.org/api/cors-test');
        const data = await response.json();
        console.log('✅ CORS Test SUCCESS:', data);
        return true;
    } catch (error) {
        console.log('❌ CORS Test FAILED:', error.message);
        return false;
    }
}

// Test 3: Send OTP Endpoint (Registration)
async function testSendOTP() {
    console.log('\n🔍 Test 3: Send OTP Endpoint');
    try {
        const response = await fetch('https://api.tasksync.org/api/auth/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                name: 'Test User',
                password: 'testpassword123'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Send OTP SUCCESS:', data);
            return true;
        } else {
            console.log('❌ Send OTP FAILED - Status:', response.status);
            const errorText = await response.text();
            console.log('Error Details:', errorText);
            return false;
        }
    } catch (error) {
        console.log('❌ Send OTP FAILED:', error.message);
        return false;
    }
}

// Test 4: Preflight Request Test
async function testPreflight() {
    console.log('\n🔍 Test 4: Preflight Request Test');
    try {
        const response = await fetch('https://api.tasksync.org/api/auth/send-otp', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://www.tasksync.org',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        
        console.log('✅ Preflight Response Status:', response.status);
        console.log('✅ Preflight Headers:', {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        });
        return true;
    } catch (error) {
        console.log('❌ Preflight Test FAILED:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running all CORS tests...\n');
    
    const results = {
        health: await testHealth(),
        cors: await testCORS(),
        sendOTP: await testSendOTP(),
        preflight: await testPreflight()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('Health Check:', results.health ? '✅ PASS' : '❌ FAIL');
    console.log('CORS Test:', results.cors ? '✅ PASS' : '❌ FAIL');
    console.log('Send OTP:', results.sendOTP ? '✅ PASS' : '❌ FAIL');
    console.log('Preflight:', results.preflight ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = Object.values(results).every(result => result);
    console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    if (!allPassed) {
        console.log('\n🔧 Troubleshooting Tips:');
        if (!results.health) console.log('- Server might not be running properly');
        if (!results.cors) console.log('- CORS configuration might not be deployed');
        if (!results.sendOTP) console.log('- CORS headers missing for POST requests');
        if (!results.preflight) console.log('- Preflight OPTIONS requests not handled');
    }
    
    return results;
}

// Export for easy access
window.corsTest = {
    testHealth,
    testCORS,
    testSendOTP,
    testPreflight,
    runAllTests
};

console.log('📝 CORS Test functions loaded. Run corsTest.runAllTests() to start testing!');
