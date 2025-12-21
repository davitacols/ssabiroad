const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GOOGLE_API_KEY = 'AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho';
const OUTPUT_DIR = path.join(__dirname, '../../data/streetview-collected');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Famous landmarks with exact addresses
const landmarks = [
  { name: 'Empire State Building', address: '20 W 34th St, New York, NY 10001, USA', lat: 40.748817, lon: -73.985428 },
  { name: 'Statue of Liberty', address: 'Liberty Island, New York, NY 10004, USA', lat: 40.689247, lon: -74.044502 },
  { name: 'Times Square', address: 'Manhattan, NY 10036, USA', lat: 40.758896, lon: -73.985130 },
  { name: 'Brooklyn Bridge', address: 'Brooklyn Bridge, New York, NY 10038, USA', lat: 40.706086, lon: -73.996864 },
  
  { name: 'Big Ben', address: 'Westminster, London SW1A 0AA, UK', lat: 51.500729, lon: -0.124625 },
  { name: 'Tower Bridge', address: 'Tower Bridge Rd, London SE1 2UP, UK', lat: 51.505554, lon: -0.075278 },
  { name: 'Buckingham Palace', address: 'London SW1A 1AA, UK', lat: 51.501364, lon: -0.141890 },
  
  { name: 'Eiffel Tower', address: '5 Avenue Anatole France, 75007 Paris, France', lat: 48.858370, lon: 2.294481 },
  { name: 'Arc de Triomphe', address: 'Place Charles de Gaulle, 75008 Paris, France', lat: 48.873792, lon: 2.295028 },
  { name: 'Louvre Museum', address: 'Rue de Rivoli, 75001 Paris, France', lat: 48.860611, lon: 2.337644 },
  
  { name: 'Tokyo Tower', address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan', lat: 35.658581, lon: 139.745438 },
  { name: 'Shibuya Crossing', address: '2 Chome-2-1 Dogenzaka, Shibuya City, Tokyo 150-0043, Japan', lat: 35.659515, lon: 139.700571 },
  
  { name: 'Burj Khalifa', address: '1 Sheikh Mohammed bin Rashid Blvd, Dubai, UAE', lat: 25.197197, lon: 55.274376 },
  { name: 'Dubai Mall', address: 'Financial Center Rd, Dubai, UAE', lat: 25.198362, lon: 55.279480 }
];

async function downloadStreetView(lat, lon, filename, address) {
  const url = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${lat},${lon}&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filename, response.data);
    return true;
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Collecting Street View images...\n');
  
  const metadata = [];
  let count = 0;
  
  for (const landmark of landmarks) {
    const filename = `${landmark.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    console.log(`📸 ${landmark.name}...`);
    const success = await downloadStreetView(landmark.lat, landmark.lon, filepath, landmark.address);
    
    if (success) {
      metadata.push({
        filename,
        name: landmark.name,
        address: landmark.address,
        latitude: landmark.lat,
        longitude: landmark.lon
      });
      count++;
      console.log(`✅ ${count}/${landmarks.length}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log(`\n✅ Collected ${count} images with addresses`);
  console.log('Run: node scripts/data-collection/train-streetview.js');
}

main().catch(console.error);
