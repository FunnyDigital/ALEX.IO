// Simple test script to verify mobile app API connectivity
const axios = require('axios');

// Test backend connection
async function testBackendConnection() {
  try {
    console.log('Testing backend connection...');
    const response = await axios.get('http://localhost:5000');
    console.log('✅ Backend connection successful:', response.data);
  } catch (error) {
    console.log('❌ Backend connection failed:');
    console.log('   Error code:', error.code);
    console.log('   Error message:', error.message);
    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Response data:', error.response.data);
    }
  }
}

// Test coin flip endpoint (without auth)
async function testCoinFlipEndpoint() {
  try {
    console.log('\nTesting coin flip endpoint...');
    const response = await axios.post('http://localhost:5000/api/games/coin-flip', {
      choice: 'heads',
      betAmount: 10
    }, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Coin flip endpoint response:', response.data);
  } catch (error) {
    console.log('❌ Coin flip endpoint failed:');
    console.log('   Error code:', error.code);
    console.log('   Error message:', error.message);
    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Response data:', error.response.data);
    }
  }
}

// Run tests
async function runTests() {
  await testBackendConnection();
  await testCoinFlipEndpoint();
}

runTests().catch(console.error);