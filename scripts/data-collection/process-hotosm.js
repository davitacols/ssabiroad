const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const SHAPEFILE_DIR = path.join(__dirname, '../../data/hotosm_nga');
const OUTPUT_DIR = path.join(__dirname, '../../data/hotosm_collected');
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const ML_API_URL = 'http://34.224.33.158:8000/train';

const SAMPLE_SIZE = 10000; // Collect 10K buildings
const DELAY = 100; // 100ms between requests

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Simple GeoJSON parser (HOT OSM exports include GeoJSON)
async function parseGeoJSON() {
  console.log('📂 Looking for GeoJSON files...');
  
  const files = fs.readdirSync(SHAPEFILE_DIR);
  const geojsonFile = files.find(f => f.endsWith('.geojson') || f.endsWith('.json'));
  
  if (!geojsonFile) {
    console.log('❌ No GeoJSON found. Checking for .shp files...');
    const shpFile = files.find(f => f.endsWith('.shp'));
    if (shpFile) {
      console.log('⚠️  Found shapefile:', shpFile);
      console.log('Install ogr2ogr to convert: npm install -g gdal');
      console.log('Then run: ogr2ogr -f GeoJSON output.geojson', shpFile);
    }
    return [];
  }

  console.log('✅ Found:', geojsonFile);
  const data = JSON.parse(fs.readFileSync(path.join(SHAPEFILE_DIR, geojsonFile), 'utf8'));
  
  const buildings = data.features
    .filter(f => f.geometry && f.geometry.coordinates)
    .map(f => {
      const coords = f.geometry.type === 'Polygon' 
        ? f.geometry.coordinates[0][0] 
        : f.geometry.coordinates;
      
      return {
        lat: coords[1],
        lng: coords[0],
        properties: f.properties || {}
      };
    });

  console.log(`📊 Total buildings: ${buildings.length.toLocaleString()}`);
  
  // Sample evenly across dataset
  const step = Math.floor(buildings.length / SAMPLE_SIZE);
  const sampled = [];
  for (let i = 0; i < buildings.length && sampled.length < SAMPLE_SIZE; i += step) {
    sampled.push(buildings[i]);
  }
  
  console.log(`✅ Sampled: ${sampled.length.toLocaleString()} buildings\n`);
  return sampled;
}

async function getStreetView(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${lat},${lng}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  
  if (response.ok && response.headers.get('content-type')?.includes('image')) {
    return await response.buffer();
  }
  return null;
}

async function reverseGeocode(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results[0]?.formatted_address || `${lat}, ${lng}`;
}

async function trainML(imageBuffer, lat, lng, address) {
  const FormData = require('form-data');
  const formData = new FormData();
  
  formData.append('file', imageBuffer, { filename: 'building.jpg' });
  formData.append('latitude', lat.toString());
  formData.append('longitude', lng.toString());
  formData.append('metadata', JSON.stringify({
    address,
    source: 'hotosm_nigeria',
    timestamp: new Date().toISOString()
  }));

  await fetch(ML_API_URL, { method: 'POST', body: formData });
}

async function collectData() {
  console.log('🚀 Starting HOT OSM Nigeria collection...\n');
  
  const buildings = await parseGeoJSON();
  if (buildings.length === 0) {
    console.log('❌ No buildings to process');
    return;
  }

  let collected = 0;
  let failed = 0;

  for (let i = 0; i < buildings.length; i++) {
    const building = buildings[i];
    
    try {
      // Get Street View image
      const image = await getStreetView(building.lat, building.lng);
      if (!image) {
        failed++;
        continue;
      }

      // Get address
      const address = await reverseGeocode(building.lat, building.lng);

      // Save locally
      const filename = `hotosm_${Date.now()}_${collected}.jpg`;
      fs.writeFileSync(path.join(OUTPUT_DIR, filename), image);

      // Train ML
      await trainML(image, building.lat, building.lng, address);

      collected++;
      console.log(`✅ [${collected}/${buildings.length}] ${address.substring(0, 50)}...`);

      await new Promise(resolve => setTimeout(resolve, DELAY));

    } catch (error) {
      failed++;
      console.error(`❌ [${i}] Error:`, error.message);
    }
  }

  console.log('\n📊 Collection Summary:');
  console.log(`✅ Collected: ${collected}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Saved to: ${OUTPUT_DIR}`);
}

collectData();
