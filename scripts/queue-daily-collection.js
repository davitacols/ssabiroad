const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const ML_API_URL = 'http://34.224.33.158:8000';
const DAILY_COLLECTION_PATH = path.join(__dirname, '..', 'data', 'daily-collection');

async function sendToQueue(imagePath, metadata) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('latitude', metadata.latitude.toString());
    formData.append('longitude', metadata.longitude.toString());
    formData.append('metadata', JSON.stringify({ address: metadata.address, location: metadata.location, state: metadata.state }));

    const response = await fetch(`${ML_API_URL}/training_queue`, {
      method: 'POST',
      body: formData,
      timeout: 5000
    });

    return response.ok;
  } catch (err) {
    return false;
  }
}

async function main() {
  const metadataPath = path.join(DAILY_COLLECTION_PATH, 'metadata_2025-12-22.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  console.log(`📊 Processing ${metadata.length} images\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const item of metadata) {
    const imgPath = path.join(DAILY_COLLECTION_PATH, item.state.toLowerCase(), 
      item.location.toLowerCase().replace(/ /g, '-'), item.filename);
    
    if (!fs.existsSync(imgPath)) {
      console.log(`⚠️  Missing: ${item.filename}`);
      continue;
    }
    
    console.log(`📤 Sending: ${item.filename}`);
    const ok = await sendToQueue(imgPath, item);
    if (ok) {
      success++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n✅ Success: ${success}\n❌ Failed: ${failed}`);
}

main();
