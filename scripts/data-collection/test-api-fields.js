const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testAPI() {
  console.log('Testing ML API fields...\n');
  
  // Create a tiny test image
  const testFile = path.join(__dirname, 'test.jpg');
  const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(testFile, pngData);
  
  // Test different field names
  const tests = [
    { name: 'Test 1: address', fields: { address: 'Test Address 123' } },
    { name: 'Test 2: location', fields: { location: 'Test Address 123' } },
    { name: 'Test 3: name', fields: { name: 'Test Address 123' } },
    { name: 'Test 4: place', fields: { place: 'Test Address 123' } }
  ];
  
  for (const test of tests) {
    console.log(`\n${test.name}:`);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));
    formData.append('latitude', '40.7128');
    formData.append('longitude', '-74.0060');
    
    for (const [key, value] of Object.entries(test.fields)) {
      formData.append(key, value);
    }
    
    try {
      const response = await axios.post('http://34.224.33.158:8000/train', formData, {
        headers: formData.getHeaders()
      });
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  fs.unlinkSync(testFile);
  
  console.log('\n\nChecking queue...');
  const queue = await axios.get('http://34.224.33.158:8000/training_queue');
  console.log('Last 4 items:');
  queue.data.samples.slice(-4).forEach(item => {
    console.log(`- ${item.metadata.name || item.metadata.address || item.metadata.location || 'No address'}`);
  });
}

testAPI().catch(console.error);
