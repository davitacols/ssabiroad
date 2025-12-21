const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ML_API_URL = 'http://34.224.33.158:8000';

async function checkQueue() {
  try {
    const response = await axios.get(`${ML_API_URL}/queue`);
    return response.data;
  } catch (error) {
    console.error('Error checking queue:', error.message);
    return null;
  }
}

async function testTraining() {
  console.log('🧪 Testing ML Training API\n');

  // Check queue before
  console.log('📊 Checking queue before training...');
  const queueBefore = await checkQueue();
  if (queueBefore) {
    console.log(`Queue size: ${queueBefore.length} items`);
    if (queueBefore.length > 0) {
      console.log(`Latest item: ${queueBefore[0].address || queueBefore[0].location || 'No address'}`);
    }
  }

  // Find first collected image
  const citiesDir = path.join(__dirname, 'collected-data');
  const cities = fs.readdirSync(citiesDir).filter(f => f.endsWith('.json'));
  
  if (cities.length === 0) {
    console.log('❌ No collected data found. Run collect-all.js first.');
    return;
  }

  const cityFile = path.join(citiesDir, cities[0]);
  const cityData = JSON.parse(fs.readFileSync(cityFile, 'utf8'));
  
  if (cityData.images.length === 0) {
    console.log('❌ No images in collected data.');
    return;
  }

  const testImage = cityData.images[0];
  console.log(`\n📸 Testing with image from ${cityData.city}:`);
  console.log(`   Address: ${testImage.address}`);
  console.log(`   Coordinates: ${testImage.latitude}, ${testImage.longitude}`);

  // Send to ML API
  console.log('\n📤 Sending to ML API...');
  try {
    const response = await axios.post(`${ML_API_URL}/train`, {
      image_url: testImage.url,
      location: testImage.address,
      latitude: testImage.latitude,
      longitude: testImage.longitude
    });

    console.log('✅ Training request successful!');
    console.log('Response:', response.data);

    // Wait a moment for queue to update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check queue after
    console.log('\n📊 Checking queue after training...');
    const queueAfter = await checkQueue();
    if (queueAfter) {
      console.log(`Queue size: ${queueAfter.length} items`);
      if (queueAfter.length > 0) {
        console.log(`Latest item: ${queueAfter[0].address || queueAfter[0].location || 'No address'}`);
      }
      
      if (queueAfter.length > (queueBefore?.length || 0)) {
        console.log('\n✅ SUCCESS! New item added to queue.');
      }
    }

  } catch (error) {
    console.error('❌ Training request failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testTraining();
