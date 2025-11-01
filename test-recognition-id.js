const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testRecognitionId() {
  try {
    // Read a test image
    const imagePath = 'D:\\ssabiroad\\public\\buildings\\empire-state.jpg';
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Test image not found. Please add a test image at:', imagePath);
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    
    // Create form data
    const formData = new FormData();
    formData.append('image', imageBuffer, 'test.jpg');
    formData.append('latitude', '51.5074');
    formData.append('longitude', '-0.1278');
    
    console.log('📤 Sending request to API...');
    
    // Send request
    const response = await fetch('http://localhost:3001/api/location-recognition-v2', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    
    console.log('\n📥 Response received:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Method:', result.method);
    
    if (result.recognitionId) {
      console.log('✅ recognitionId:', result.recognitionId);
    } else {
      console.log('❌ recognitionId is missing!');
    }
    
    console.log('\nFull response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRecognitionId();
