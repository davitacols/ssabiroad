const fetch = require('node-fetch');

async function testConnection() {
  try {
    console.log('Testing ML service connection...\n');
    
    const response = await fetch('http://localhost:8000/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ ML service is running');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ ML service returned error:', response.status);
    }
  } catch (error) {
    console.log('❌ Cannot connect to ML service:', error.message);
    console.log('\n💡 Make sure to restart the ML service with: python app.py');
  }
}

testConnection();
