const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const ML_API_URL = 'http://34.224.33.158:8000';

async function quickTest() {
  console.log('🧪 Quick ML API Test\n');

  // Create a simple test image (1x1 pixel PNG)
  const testFile = path.join(__dirname, 'test-image.png');
  const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(testFile, pngData);
  console.log('✅ Test image created\n');

  const formData = new FormData();
  formData.append('file', fs.createReadStream(testFile));
  formData.append('latitude', '48.8584');
  formData.append('longitude', '2.2945');
  formData.append('address', '5 Avenue Anatole France, 75007 Paris, France');
  formData.append('metadata', JSON.stringify({ source: 'test', location: 'Eiffel Tower' }));

  console.log('📸 Test: Eiffel Tower');
  console.log('📍 Address: 5 Avenue Anatole France, 75007 Paris, France');
  console.log('🌐 Coordinates: 48.8584, 2.2945\n');

  try {
    console.log('📤 Sending to ML API...');
    const response = await axios.post(`${ML_API_URL}/train`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    console.log('✅ SUCCESS! Training request accepted');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    fs.unlinkSync(testFile);
    
    console.log('\n✅ The ML API is working correctly!');
    console.log('You can now run: node scripts/data-collection/train-collected.js');

  } catch (error) {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    
    console.error('❌ FAILED:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to ML API. Is the server running?');
    }
  }
}

quickTest();
