const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GOOGLE_API_KEY = 'AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho';
const OUTPUT_DIR = path.join(__dirname, '../../data/osm-collected');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Query OSM Overpass API for buildings with addresses
 */
async function queryOSMBuildings(lat, lon, radius = 1000) {
  const query = `
    [out:json][timeout:25];
    (
      way["building"]["addr:street"](around:${radius},${lat},${lon});
      relation["building"]["addr:street"](around:${radius},${lat},${lon});
    );
    out center;
  `;
  
  try {
    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 'Content-Type': 'text/plain' },
      timeout: 30000
    });
    return response.data.elements || [];
  } catch (error) {
    console.error('OSM query error:', error.message);
    return [];
  }
}

/**
 * Format OSM address from tags
 */
function formatAddress(tags) {
  const parts = [];
  
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  if (tags['addr:country']) parts.push(tags['addr:country']);
  
  return parts.join(', ');
}

/**
 * Get Street View image from Google
 */
async function getStreetViewImage(lat, lon, filepath) {
  const url = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${lat},${lon}&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    // Check if it's an actual image (not "no imagery" response)
    if (response.data.length > 5000) {
      fs.writeFileSync(filepath, response.data);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Collect data for a city
 */
async function collectCity(cityName, lat, lon) {
  console.log(`\n🏙️  Collecting ${cityName}...`);
  
  const cityDir = path.join(OUTPUT_DIR, cityName.toLowerCase().replace(/\s+/g, '-'));
  if (!fs.existsSync(cityDir)) {
    fs.mkdirSync(cityDir, { recursive: true });
  }
  
  // Get buildings from OSM
  console.log('📍 Querying OSM for buildings...');
  const buildings = await queryOSMBuildings(lat, lon, 2000);
  console.log(`Found ${buildings.length} buildings with addresses`);
  
  const metadata = [];
  let collected = 0;
  
  for (const building of buildings.slice(0, 30)) { // Limit to 30 per city
    const tags = building.tags || {};
    const address = formatAddress(tags);
    
    if (!address) continue;
    
    // Get building center coordinates
    const buildingLat = building.center?.lat || building.lat;
    const buildingLon = building.center?.lon || building.lon;
    
    if (!buildingLat || !buildingLon) continue;
    
    // Get Street View image
    const filename = `osm_${building.id}.jpg`;
    const filepath = path.join(cityDir, filename);
    
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skip: ${filename}`);
      continue;
    }
    
    const success = await getStreetViewImage(buildingLat, buildingLon, filepath);
    
    if (success) {
      metadata.push({
        id: building.id,
        filename,
        address,
        latitude: buildingLat,
        longitude: buildingLon,
        building_type: tags.building,
        name: tags.name || tags['addr:housename'] || '',
        city: cityName
      });
      
      collected++;
      console.log(`✅ ${collected}: ${address}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }
  
  // Save metadata
  fs.writeFileSync(
    path.join(cityDir, 'metadata.json'),
    JSON.stringify({ city: cityName, buildings: metadata }, null, 2)
  );
  
  console.log(`✅ Collected ${collected} buildings for ${cityName}`);
  return metadata;
}

/**
 * Main collection function
 */
async function main() {
  const cities = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708 }
  ];
  
  console.log('🚀 Starting OSM + Mapillary collection...\n');
  
  const allMetadata = [];
  
  for (const city of cities) {
    const metadata = await collectCity(city.name, city.lat, city.lon);
    allMetadata.push(...metadata);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Pause between cities
  }
  
  // Save combined metadata
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-metadata.json'),
    JSON.stringify(allMetadata, null, 2)
  );
  
  console.log(`\n\n🎉 Collection complete!`);
  console.log(`📊 Total buildings: ${allMetadata.length}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review: ${OUTPUT_DIR}`);
  console.log(`2. Train: node scripts/data-collection/train-osm.js`);
}

main().catch(console.error);
