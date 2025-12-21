const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GOOGLE_API_KEY = 'AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho';
const OUTPUT_DIR = path.join(__dirname, '../../data/nigeria-massive');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Comprehensive Nigerian cities and landmarks
const nigerianLocations = [
  // Lagos State (Commercial Capital)
  { name: 'Lagos Island', lat: 6.4541, lon: 3.3947, density: 'high' },
  { name: 'Victoria Island', lat: 6.4281, lon: 3.4219, density: 'high' },
  { name: 'Ikoyi', lat: 6.4541, lon: 3.4316, density: 'high' },
  { name: 'Lekki', lat: 6.4474, lon: 3.5635, density: 'high' },
  { name: 'Ikeja', lat: 6.5964, lon: 3.3406, density: 'high' },
  { name: 'Surulere', lat: 6.4969, lon: 3.3539, density: 'high' },
  { name: 'Yaba', lat: 6.5158, lon: 3.3711, density: 'high' },
  { name: 'Apapa', lat: 6.4489, lon: 3.3594, density: 'medium' },
  { name: 'Ajah', lat: 6.4698, lon: 3.5852, density: 'medium' },
  { name: 'Epe', lat: 6.5833, lon: 3.9833, density: 'low' },
  
  // Abuja (Federal Capital)
  { name: 'Central Business District Abuja', lat: 9.0579, lon: 7.4951, density: 'high' },
  { name: 'Garki Abuja', lat: 9.0354, lon: 7.4870, density: 'high' },
  { name: 'Wuse Abuja', lat: 9.0643, lon: 7.4892, density: 'high' },
  { name: 'Maitama Abuja', lat: 9.0820, lon: 7.4951, density: 'high' },
  { name: 'Asokoro Abuja', lat: 9.0333, lon: 7.5333, density: 'medium' },
  { name: 'Gwarinpa Abuja', lat: 9.1108, lon: 7.4114, density: 'medium' },
  
  // Port Harcourt (Rivers State)
  { name: 'Port Harcourt GRA', lat: 4.8156, lon: 7.0498, density: 'high' },
  { name: 'Port Harcourt Trans Amadi', lat: 4.8067, lon: 7.0335, density: 'medium' },
  { name: 'Port Harcourt Rumuola', lat: 4.8447, lon: 7.0167, density: 'medium' },
  
  // Kano (Northern Commercial Hub)
  { name: 'Kano City', lat: 12.0022, lon: 8.5919, density: 'high' },
  { name: 'Kano Sabon Gari', lat: 11.9969, lon: 8.5153, density: 'medium' },
  
  // Ibadan (Oyo State)
  { name: 'Ibadan Bodija', lat: 7.4347, lon: 3.9056, density: 'high' },
  { name: 'Ibadan Dugbe', lat: 7.3775, lon: 3.9470, density: 'high' },
  { name: 'Ibadan Ring Road', lat: 7.3878, lon: 3.9339, density: 'medium' },
  
  // Benin City (Edo State)
  { name: 'Benin City', lat: 6.3350, lon: 5.6037, density: 'high' },
  { name: 'Benin City GRA', lat: 6.3176, lon: 5.6145, density: 'medium' },
  
  // Enugu (South East)
  { name: 'Enugu', lat: 6.4403, lon: 7.4914, density: 'high' },
  { name: 'Enugu Independence Layout', lat: 6.4698, lon: 7.5251, density: 'medium' },
  
  // Kaduna (North West)
  { name: 'Kaduna', lat: 10.5105, lon: 7.4165, density: 'high' },
  
  // Calabar (Cross River)
  { name: 'Calabar', lat: 4.9517, lon: 8.3417, density: 'medium' },
  
  // Owerri (Imo State)
  { name: 'Owerri', lat: 5.4840, lon: 7.0351, density: 'medium' },
  
  // Warri (Delta State)
  { name: 'Warri', lat: 5.5167, lon: 5.7500, density: 'medium' },
  
  // Abeokuta (Ogun State)
  { name: 'Abeokuta', lat: 7.1475, lon: 3.3619, density: 'medium' },
  
  // Jos (Plateau State)
  { name: 'Jos', lat: 9.8965, lon: 8.8583, density: 'medium' },
  
  // Akure (Ondo State)
  { name: 'Akure', lat: 7.2571, lon: 5.2058, density: 'medium' },
  
  // Ilorin (Kwara State)
  { name: 'Ilorin', lat: 8.4966, lon: 4.5426, density: 'medium' }
];

async function getStreetView(lat, lon, heading = 0) {
  const url = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${lat},${lon}&heading=${heading}&key=${GOOGLE_API_KEY}`;
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    return response.data.length > 5000 ? response.data : null;
  } catch {
    return null;
  }
}

async function reverseGeocode(lat, lon) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data.results[0]?.formatted_address || 'Nigeria';
  } catch {
    return 'Nigeria';
  }
}

async function collectLocation(location) {
  console.log(`\n📍 ${location.name}...`);
  
  const cityDir = path.join(OUTPUT_DIR, location.name.toLowerCase().replace(/\s+/g, '-'));
  if (!fs.existsSync(cityDir)) {
    fs.mkdirSync(cityDir, { recursive: true });
  }
  
  const metadata = [];
  let collected = 0;
  
  // Determine collection intensity based on density
  const gridPoints = location.density === 'high' ? 50 : location.density === 'medium' ? 30 : 15;
  const gridSize = location.density === 'high' ? 0.003 : 0.005;
  const headings = [0, 90, 180, 270]; // 4 directions
  
  // Grid-based collection
  for (let i = 0; i < Math.sqrt(gridPoints); i++) {
    for (let j = 0; j < Math.sqrt(gridPoints); j++) {
      const pointLat = location.lat + (i - Math.sqrt(gridPoints)/2) * gridSize;
      const pointLon = location.lon + (j - Math.sqrt(gridPoints)/2) * gridSize;
      
      // Collect multiple angles
      for (const heading of headings) {
        const filename = `${location.name.replace(/\s+/g, '_')}_${i}_${j}_${heading}.jpg`;
        const filepath = path.join(cityDir, filename);
        
        if (fs.existsSync(filepath)) continue;
        
        const imageData = await getStreetView(pointLat, pointLon, heading);
        
        if (imageData) {
          fs.writeFileSync(filepath, imageData);
          
          // Get address for first angle only
          if (heading === 0) {
            const address = await reverseGeocode(pointLat, pointLon);
            
            metadata.push({
              filename,
              address,
              latitude: pointLat,
              longitude: pointLon,
              heading,
              location: location.name,
              state: location.name.includes('Lagos') ? 'Lagos' : 
                     location.name.includes('Abuja') ? 'FCT' :
                     location.name.includes('Port Harcourt') ? 'Rivers' :
                     location.name.includes('Kano') ? 'Kano' :
                     location.name.includes('Ibadan') ? 'Oyo' : 'Nigeria'
            });
          }
          
          collected++;
          if (collected % 20 === 0) console.log(`  ✅ ${collected} images`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  fs.writeFileSync(
    path.join(cityDir, 'metadata.json'),
    JSON.stringify({ location: location.name, images: metadata }, null, 2)
  );
  
  console.log(`✅ ${location.name}: ${collected} images`);
  return metadata;
}

async function main() {
  console.log('🇳🇬 NIGERIA MASSIVE DATA COLLECTION');
  console.log('='.repeat(60));
  console.log(`📊 Locations: ${nigerianLocations.length}`);
  console.log(`📸 Expected: ~${nigerianLocations.reduce((sum, loc) => {
    const points = loc.density === 'high' ? 50 : loc.density === 'medium' ? 30 : 15;
    return sum + (points * 4); // 4 angles per point
  }, 0)} images`);
  console.log('='.repeat(60));
  
  const allMetadata = [];
  let totalCollected = 0;
  
  for (const location of nigerianLocations) {
    const metadata = await collectLocation(location);
    allMetadata.push(...metadata);
    totalCollected += metadata.length;
    
    console.log(`📊 Running total: ${totalCollected} images\n`);
  }
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-metadata.json'),
    JSON.stringify(allMetadata, null, 2)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 COLLECTION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`📊 Total images: ${allMetadata.length}`);
  console.log(`📁 Location: ${OUTPUT_DIR}`);
  console.log(`\nBreakdown by state:`);
  
  const byState = {};
  allMetadata.forEach(item => {
    byState[item.state] = (byState[item.state] || 0) + 1;
  });
  
  Object.entries(byState).sort((a, b) => b[1] - a[1]).forEach(([state, count]) => {
    console.log(`  ${state}: ${count} images`);
  });
  
  console.log(`\nNext: node scripts/data-collection/train-nigeria.js`);
}

main().catch(console.error);
