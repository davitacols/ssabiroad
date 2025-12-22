/**
 * Send Daily Collection Data to ML Training
 * 
 * This script reads images and metadata from /data/daily-collection
 * and sends them to the ML API for training with correct addresses
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';
const DAILY_COLLECTION_PATH = path.join(__dirname, '..', 'data', 'daily-collection');
const BATCH_SIZE = 10; // Process 10 images at a time
const DELAY_MS = 1000; // 1 second delay between batches

async function sendToML(imagePath, metadata) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('label', metadata.address);
    formData.append('latitude', metadata.latitude.toString());
    formData.append('longitude', metadata.longitude.toString());

    const response = await fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to send ${path.basename(imagePath)}:`, error.message);
    return null;
  }
}

async function processCollection() {
  console.log('🚀 Starting daily collection ML training upload...\n');

  // Read metadata file
  const metadataPath = path.join(DAILY_COLLECTION_PATH, 'metadata_2025-12-22.json');
  
  if (!fs.existsSync(metadataPath)) {
    console.error('❌ Metadata file not found:', metadataPath);
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  console.log(`📊 Found ${metadata.length} images in metadata\n`);

  // Create a map of filename to metadata
  const metadataMap = new Map();
  metadata.forEach(item => {
    metadataMap.set(item.filename, item);
  });

  // Recursively find all images
  function findImages(dir, relativePath = '') {
    const results = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        results.push(...findImages(fullPath, path.join(relativePath, item)));
      } else if ((item.endsWith('.jpg') || item.endsWith('.png')) && metadataMap.has(item)) {
        results.push({ file: item, relativePath: path.join(relativePath, item) });
      }
    }
    return results;
  }
  
  const imageFiles = findImages(DAILY_COLLECTION_PATH);

  console.log(`🖼️  Found ${imageFiles.length} images to process\n`);

  let processed = 0;
  let successful = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
    const batch = imageFiles.slice(i, i + BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(imageFiles.length / BATCH_SIZE)}`);
    
    const promises = batch.map(async ({ file: filename, relativePath }) => {
      const imagePath = path.join(DAILY_COLLECTION_PATH, relativePath);
      const meta = metadataMap.get(filename);
      
      console.log(`  ⏳ Sending: ${filename}`);
      console.log(`     Address: ${meta.address}`);
      
      const result = await sendToML(imagePath, meta);
      
      if (result) {
        console.log(`  ✅ Success: ${filename}`);
        successful++;
      } else {
        console.log(`  ❌ Failed: ${filename}`);
        failed++;
      }
      
      processed++;
      return result;
    });

    await Promise.all(promises);

    // Progress update
    console.log(`\n📈 Progress: ${processed}/${imageFiles.length} (${Math.round(processed / imageFiles.length * 100)}%)`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);

    // Delay between batches (except for the last batch)
    if (i + BATCH_SIZE < imageFiles.length) {
      console.log(`\n⏸️  Waiting ${DELAY_MS}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Upload Complete!');
  console.log('='.repeat(60));
  console.log(`Total Processed: ${processed}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round(successful / processed * 100)}%`);
  console.log('='.repeat(60) + '\n');
}

// Run the script
processCollection().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
