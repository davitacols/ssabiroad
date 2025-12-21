// Master Data Collection Script
// Runs both Flickr and Wikimedia collectors, then prepares data for ML training

const fs = require('fs');
const path = require('path');
const { collectLocationData: collectFlickr } = require('./flickr-collector');
const { collectLocationData: collectWikimedia } = require('./wikimedia-collector');

const ML_TRAINING_DIR = path.join(__dirname, '../../ml-models/data/collected');

/**
 * Prepare collected data for ML training
 */
function prepareForMLTraining(flickrMetadata, wikimediaMetadata) {
  console.log('\n📦 Preparing data for ML training...');
  
  if (!fs.existsSync(ML_TRAINING_DIR)) {
    fs.mkdirSync(ML_TRAINING_DIR, { recursive: true });
  }
  
  const trainingData = [];
  
  // Process Flickr data
  flickrMetadata.forEach(item => {
    trainingData.push({
      image_path: path.join('../../data/flickr-collected', item.city.toLowerCase().replace(/\s+/g, '-'), item.filename),
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.city,
      metadata: {
        source: 'flickr',
        title: item.title,
        description: item.description,
        tags: item.tags,
        date_taken: item.dateTaken
      }
    });
  });
  
  // Process Wikimedia data
  wikimediaMetadata.forEach(item => {
    trainingData.push({
      image_path: path.join('../../data/wikimedia-collected', item.city.toLowerCase().replace(/\s+/g, '-'), item.filename),
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.city,
      metadata: {
        source: 'wikimedia',
        title: item.title,
        description: item.description,
        license: item.license,
        artist: item.artist
      }
    });
  });
  
  // Save training manifest
  const manifestPath = path.join(ML_TRAINING_DIR, 'training-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(trainingData, null, 2));
  
  console.log(`✅ Training manifest created: ${manifestPath}`);
  console.log(`📊 Total training samples: ${trainingData.length}`);
  
  return trainingData;
}

/**
 * Send data to ML API for training
 */
async function sendToMLAPI(trainingData) {
  const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';
  
  console.log(`\n🚀 Sending data to ML API: ${ML_API_URL}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const item of trainingData) {
    try {
      const imagePath = path.resolve(__dirname, '../..', item.image_path);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`⚠️  Image not found: ${imagePath}`);
        continue;
      }
      
      const formData = new FormData();
      const imageBuffer = fs.readFileSync(imagePath);
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      
      formData.append('file', blob, path.basename(imagePath));
      formData.append('latitude', item.latitude.toString());
      formData.append('longitude', item.longitude.toString());
      formData.append('address', item.address);
      formData.append('metadata', JSON.stringify(item.metadata));
      
      const response = await fetch(`${ML_API_URL}/train`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        successCount++;
        console.log(`✅ Sent ${successCount}/${trainingData.length}: ${path.basename(imagePath)}`);
      } else {
        errorCount++;
        console.log(`❌ Failed to send: ${path.basename(imagePath)}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      errorCount++;
      console.error(`❌ Error sending data:`, err.message);
    }
  }
  
  console.log(`\n📊 ML Training Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

/**
 * Main collection workflow
 */
async function runFullCollection() {
  console.log('🎯 Starting Full Data Collection Pipeline\n');
  console.log('=' .repeat(60));
  
  const cities = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Lagos', lat: 6.5244, lon: 3.3792 }
  ];
  
  const allFlickrData = [];
  const allWikimediaData = [];
  
  // Collect from both sources
  for (const city of cities) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Processing: ${city.name}`);
    console.log('='.repeat(60));
    
    // Flickr collection
    if (process.env.FLICKR_API_KEY && process.env.FLICKR_API_KEY !== 'YOUR_API_KEY_HERE') {
      const flickrData = await collectFlickr(city.name, city.lat, city.lon, 30);
      allFlickrData.push(...flickrData);
    } else {
      console.log('⚠️  Skipping Flickr (API key not set)');
    }
    
    // Wikimedia collection
    const wikimediaData = await collectWikimedia(city.name, city.lat, city.lon, 30);
    allWikimediaData.push(...wikimediaData);
    
    // Pause between cities
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 Collection Summary');
  console.log('='.repeat(60));
  console.log(`Flickr images: ${allFlickrData.length}`);
  console.log(`Wikimedia images: ${allWikimediaData.length}`);
  console.log(`Total images: ${allFlickrData.length + allWikimediaData.length}`);
  
  // Prepare for ML training
  const trainingData = prepareForMLTraining(allFlickrData, allWikimediaData);
  
  // Optionally send to ML API
  const sendToAPI = process.argv.includes('--send-to-api');
  if (sendToAPI) {
    await sendToMLAPI(trainingData);
  } else {
    console.log('\n💡 Tip: Run with --send-to-api flag to automatically send data to ML API');
  }
  
  console.log('\n✅ Data collection pipeline complete!');
}

// Run if called directly
if (require.main === module) {
  runFullCollection().catch(console.error);
}

module.exports = { prepareForMLTraining, sendToMLAPI, runFullCollection };
