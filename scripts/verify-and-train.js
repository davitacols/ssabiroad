const fs = require('fs').promises;
const path = require('path');

const DAILY_COLLECTION_PATH = path.join(__dirname, '..', 'data', 'daily-collection');
const VERIFIED_PATH = path.join(__dirname, '..', 'data', 'verified');
const ML_TRAINING_PATH = path.join(__dirname, '..', 'data', 'ml-training');

async function verifyImages() {
  const metadataFiles = await fs.readdir(DAILY_COLLECTION_PATH);
  const jsonFiles = metadataFiles.filter(f => f.endsWith('.json'));
  
  for (const jsonFile of jsonFiles) {
    const metadataPath = path.join(DAILY_COLLECTION_PATH, jsonFile);
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    
    console.log(`Processing ${metadata.length} images from ${jsonFile}`);
    
    const verified = [];
    for (const item of metadata) {
      const imagePath = path.join(DAILY_COLLECTION_PATH, item.state.toLowerCase(), 
        item.location.toLowerCase().replace(/ /g, '-'), item.filename);
      
      try {
        await fs.access(imagePath);
        verified.push({...item, verified: true, verifiedAt: new Date().toISOString()});
      } catch {
        console.warn(`Missing: ${imagePath}`);
      }
    }
    
    await fs.mkdir(VERIFIED_PATH, {recursive: true});
    await fs.writeFile(
      path.join(VERIFIED_PATH, `verified_${jsonFile}`),
      JSON.stringify(verified, null, 2)
    );
    
    console.log(`Verified ${verified.length}/${metadata.length} images`);
  }
}

async function prepareMLDataset() {
  await fs.mkdir(ML_TRAINING_PATH, {recursive: true});
  
  const verifiedFiles = await fs.readdir(VERIFIED_PATH);
  const allData = [];
  
  for (const file of verifiedFiles) {
    if (file.endsWith('.json')) {
      const data = JSON.parse(await fs.readFile(path.join(VERIFIED_PATH, file), 'utf-8'));
      allData.push(...data);
    }
  }
  
  const dataset = {
    total: allData.length,
    locations: [...new Set(allData.map(d => d.location))],
    states: [...new Set(allData.map(d => d.state))],
    dateRange: {
      start: allData[0]?.date,
      end: allData[allData.length - 1]?.date
    },
    samples: allData.map(d => ({
      image: d.filename,
      location: d.location,
      state: d.state,
      coordinates: {lat: d.latitude, lng: d.longitude},
      address: d.address
    }))
  };
  
  await fs.writeFile(
    path.join(ML_TRAINING_PATH, 'training_dataset.json'),
    JSON.stringify(dataset, null, 2)
  );
  
  console.log(`ML dataset prepared: ${dataset.total} samples`);
  console.log(`Locations: ${dataset.locations.length}`);
  console.log(`States: ${dataset.states.length}`);
}

async function main() {
  console.log('Starting verification and ML preparation...');
  await verifyImages();
  await prepareMLDataset();
  console.log('Complete!');
}

main().catch(console.error);
