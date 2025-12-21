const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GOOGLE_API_KEY = 'AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho';
const OUTPUT_DIR = path.join(__dirname, '../../data/daily-collection');
const STATE_FILE = path.join(__dirname, 'collection-state.json');
const DAILY_LIMIT = 24000; // Leave buffer for other API calls

// All Nigerian states with major cities
const allNigerianLocations = [
  // Lagos State
  { name: 'Lagos Island', lat: 6.4541, lon: 3.3947, state: 'Lagos' },
  { name: 'Victoria Island', lat: 6.4281, lon: 3.4219, state: 'Lagos' },
  { name: 'Ikoyi', lat: 6.4541, lon: 3.4316, state: 'Lagos' },
  { name: 'Lekki', lat: 6.4474, lon: 3.5635, state: 'Lagos' },
  { name: 'Ikeja', lat: 6.5964, lon: 3.3406, state: 'Lagos' },
  { name: 'Surulere', lat: 6.4969, lon: 3.3539, state: 'Lagos' },
  { name: 'Yaba', lat: 6.5158, lon: 3.3711, state: 'Lagos' },
  { name: 'Apapa', lat: 6.4489, lon: 3.3594, state: 'Lagos' },
  { name: 'Ajah', lat: 6.4698, lon: 3.5852, state: 'Lagos' },
  { name: 'Epe', lat: 6.5833, lon: 3.9833, state: 'Lagos' },
  { name: 'Badagry', lat: 6.4167, lon: 2.8833, state: 'Lagos' },
  { name: 'Ikorodu', lat: 6.6194, lon: 3.5111, state: 'Lagos' },
  
  // FCT Abuja
  { name: 'Central Area Abuja', lat: 9.0579, lon: 7.4951, state: 'FCT' },
  { name: 'Garki', lat: 9.0354, lon: 7.4870, state: 'FCT' },
  { name: 'Wuse', lat: 9.0643, lon: 7.4892, state: 'FCT' },
  { name: 'Maitama', lat: 9.0820, lon: 7.4951, state: 'FCT' },
  { name: 'Asokoro', lat: 9.0333, lon: 7.5333, state: 'FCT' },
  { name: 'Gwarinpa', lat: 9.1108, lon: 7.4114, state: 'FCT' },
  { name: 'Kubwa', lat: 9.1372, lon: 7.3378, state: 'FCT' },
  { name: 'Lugbe', lat: 8.9667, lon: 7.3667, state: 'FCT' },
  
  // Rivers State
  { name: 'Port Harcourt GRA', lat: 4.8156, lon: 7.0498, state: 'Rivers' },
  { name: 'Port Harcourt Diobu', lat: 4.7833, lon: 7.0167, state: 'Rivers' },
  { name: 'Eleme', lat: 4.7667, lon: 7.1167, state: 'Rivers' },
  { name: 'Obio-Akpor', lat: 4.8833, lon: 7.0333, state: 'Rivers' },
  
  // Kano State
  { name: 'Kano City', lat: 12.0022, lon: 8.5919, state: 'Kano' },
  { name: 'Sabon Gari Kano', lat: 11.9969, lon: 8.5153, state: 'Kano' },
  { name: 'Fagge', lat: 12.0000, lon: 8.5167, state: 'Kano' },
  
  // Oyo State
  { name: 'Ibadan Bodija', lat: 7.4347, lon: 3.9056, state: 'Oyo' },
  { name: 'Ibadan Dugbe', lat: 7.3775, lon: 3.9470, state: 'Oyo' },
  { name: 'Ibadan Ring Road', lat: 7.3878, lon: 3.9339, state: 'Oyo' },
  { name: 'Ibadan Challenge', lat: 7.4333, lon: 3.9167, state: 'Oyo' },
  
  // Edo State
  { name: 'Benin City', lat: 6.3350, lon: 5.6037, state: 'Edo' },
  { name: 'Benin GRA', lat: 6.3176, lon: 5.6145, state: 'Edo' },
  
  // Enugu State
  { name: 'Enugu', lat: 6.4403, lon: 7.4914, state: 'Enugu' },
  { name: 'Independence Layout', lat: 6.4698, lon: 7.5251, state: 'Enugu' },
  
  // Kaduna State
  { name: 'Kaduna', lat: 10.5105, lon: 7.4165, state: 'Kaduna' },
  { name: 'Zaria', lat: 11.0667, lon: 7.7000, state: 'Kaduna' },
  
  // Cross River
  { name: 'Calabar', lat: 4.9517, lon: 8.3417, state: 'Cross River' },
  
  // Imo State
  { name: 'Owerri', lat: 5.4840, lon: 7.0351, state: 'Imo' },
  
  // Delta State
  { name: 'Warri', lat: 5.5167, lon: 5.7500, state: 'Delta' },
  { name: 'Asaba', lat: 6.1833, lon: 6.7333, state: 'Delta' },
  
  // Ogun State
  { name: 'Abeokuta', lat: 7.1475, lon: 3.3619, state: 'Ogun' },
  
  // Plateau State
  { name: 'Jos', lat: 9.8965, lon: 8.8583, state: 'Plateau' },
  
  // Ondo State
  { name: 'Akure', lat: 7.2571, lon: 5.2058, state: 'Ondo' },
  
  // Kwara State
  { name: 'Ilorin', lat: 8.4966, lon: 4.5426, state: 'Kwara' },
  
  // Anambra State
  { name: 'Onitsha', lat: 6.1667, lon: 6.7833, state: 'Anambra' },
  { name: 'Awka', lat: 6.2104, lon: 7.0719, state: 'Anambra' },
  
  // Abia State
  { name: 'Aba', lat: 5.1167, lon: 7.3667, state: 'Abia' },
  { name: 'Umuahia', lat: 5.5333, lon: 7.4833, state: 'Abia' }
];

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return {
    currentLocationIndex: 0,
    currentGridX: 0,
    currentGridY: 0,
    currentHeading: 0,
    totalCollected: 0,
    dailyCount: 0,
    lastResetDate: new Date().toDateString()
  };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function getStreetView(lat, lon, heading) {
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

async function collectDaily() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const state = loadState();
  
  // Reset daily counter if new day
  const today = new Date().toDateString();
  if (state.lastResetDate !== today) {
    state.dailyCount = 0;
    state.lastResetDate = today;
    console.log('🌅 New day! Counter reset.');
  }
  
  console.log('🇳🇬 DAILY NIGERIA COLLECTION');
  console.log('='.repeat(60));
  console.log(`📊 Total collected: ${state.totalCollected}`);
  console.log(`📅 Today: ${state.dailyCount}/${DAILY_LIMIT}`);
  console.log(`📍 Current location: ${allNigerianLocations[state.currentLocationIndex].name}`);
  console.log('='.repeat(60));
  
  const headings = [0, 90, 180, 270];
  const gridSize = 0.002; // Dense grid
  const gridDimension = 20; // 20x20 grid per location
  
  let collected = 0;
  const metadata = [];
  
  while (state.dailyCount < DAILY_LIMIT && state.currentLocationIndex < allNigerianLocations.length) {
    const location = allNigerianLocations[state.currentLocationIndex];
    
    const locationDir = path.join(OUTPUT_DIR, location.state.toLowerCase(), location.name.toLowerCase().replace(/\s+/g, '-'));
    if (!fs.existsSync(locationDir)) {
      fs.mkdirSync(locationDir, { recursive: true });
    }
    
    // Calculate current point
    const pointLat = location.lat + (state.currentGridX - gridDimension/2) * gridSize;
    const pointLon = location.lon + (state.currentGridY - gridDimension/2) * gridSize;
    const heading = headings[state.currentHeading];
    
    const filename = `${location.name.replace(/\s+/g, '_')}_${state.currentGridX}_${state.currentGridY}_${heading}.jpg`;
    const filepath = path.join(locationDir, filename);
    
    if (!fs.existsSync(filepath)) {
      const imageData = await getStreetView(pointLat, pointLon, heading);
      
      if (imageData) {
        fs.writeFileSync(filepath, imageData);
        
        // Get address for first heading only
        if (state.currentHeading === 0) {
          const address = await reverseGeocode(pointLat, pointLon);
          
          metadata.push({
            filename,
            address,
            latitude: pointLat,
            longitude: pointLon,
            heading,
            location: location.name,
            state: location.state,
            date: new Date().toISOString()
          });
        }
        
        collected++;
        state.dailyCount++;
        state.totalCollected++;
        
        if (collected % 100 === 0) {
          console.log(`✅ ${collected} collected today | Total: ${state.totalCollected} | Remaining: ${DAILY_LIMIT - state.dailyCount}`);
          saveState(state);
        }
      }
    }
    
    // Move to next heading
    state.currentHeading++;
    if (state.currentHeading >= headings.length) {
      state.currentHeading = 0;
      state.currentGridY++;
      
      if (state.currentGridY >= gridDimension) {
        state.currentGridY = 0;
        state.currentGridX++;
        
        if (state.currentGridX >= gridDimension) {
          state.currentGridX = 0;
          state.currentLocationIndex++;
          
          if (state.currentLocationIndex < allNigerianLocations.length) {
            console.log(`\n📍 Moving to: ${allNigerianLocations[state.currentLocationIndex].name}`);
          }
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Save metadata
  if (metadata.length > 0) {
    const todayFile = path.join(OUTPUT_DIR, `metadata_${new Date().toISOString().split('T')[0]}.json`);
    const existing = fs.existsSync(todayFile) ? JSON.parse(fs.readFileSync(todayFile, 'utf8')) : [];
    fs.writeFileSync(todayFile, JSON.stringify([...existing, ...metadata], null, 2));
  }
  
  saveState(state);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SESSION COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Collected today: ${state.dailyCount}/${DAILY_LIMIT}`);
  console.log(`📈 Total all-time: ${state.totalCollected}`);
  console.log(`📍 Progress: ${state.currentLocationIndex}/${allNigerianLocations.length} locations`);
  
  if (state.dailyCount >= DAILY_LIMIT) {
    console.log('\n⚠️  Daily limit reached! Run again tomorrow.');
  } else if (state.currentLocationIndex >= allNigerianLocations.length) {
    console.log('\n🎉 All locations completed! Resetting to start...');
    state.currentLocationIndex = 0;
    state.currentGridX = 0;
    state.currentGridY = 0;
    state.currentHeading = 0;
    saveState(state);
  }
  
  console.log(`\nNext: node scripts/data-collection/train-daily.js`);
}

collectDaily().catch(console.error);
