// Add proper addresses to collected data using reverse geocoding
const fs = require('fs');
const path = require('path');
const https = require('https');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho';
const METADATA_FILE = path.join(__dirname, '../../data/wikimedia-collected/all-metadata.json');

async function reverseGeocode(lat, lon) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'OK' && result.results[0]) {
            resolve(result.results[0].formatted_address);
          } else {
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function enrichMetadata() {
  console.log('🔍 Enriching metadata with proper addresses...\n');
  
  if (!fs.existsSync(METADATA_FILE)) {
    console.error('❌ Metadata file not found.');
    process.exit(1);
  }
  
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  console.log(`📊 Processing ${metadata.length} images\n`);
  
  let enriched = 0;
  
  for (let i = 0; i < metadata.length; i++) {
    const item = metadata[i];
    
    try {
      const address = await reverseGeocode(item.latitude, item.longitude);
      
      if (address) {
        item.address = address;
        enriched++;
        console.log(`✅ [${i+1}/${metadata.length}] ${item.city}: ${address.substring(0, 60)}...`);
      } else {
        item.address = item.city;
        console.log(`⚠️  [${i+1}/${metadata.length}] ${item.city}: Using city name as fallback`);
      }
      
      // Rate limiting (Google allows 50 req/sec)
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      item.address = item.city;
      console.error(`❌ Error for ${item.city}:`, err.message);
    }
  }
  
  // Save enriched metadata
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  
  // Also update individual city files
  const cities = [...new Set(metadata.map(m => m.city))];
  for (const city of cities) {
    const cityDir = city.toLowerCase().replace(/\s+/g, '-');
    const cityMetadataFile = path.join(__dirname, '../../data/wikimedia-collected', cityDir, 'metadata.json');
    const cityData = metadata.filter(m => m.city === city);
    fs.writeFileSync(cityMetadataFile, JSON.stringify(cityData, null, 2));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Metadata enrichment complete!');
  console.log(`📍 Enriched ${enriched}/${metadata.length} addresses`);
  console.log(`📄 Updated: ${METADATA_FILE}`);
}

enrichMetadata().catch(console.error);
