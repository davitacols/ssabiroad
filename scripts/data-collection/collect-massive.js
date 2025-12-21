const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GOOGLE_API_KEY = 'AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho';
const OUTPUT_DIR = path.join(__dirname, '../../data/massive-collected');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Strategy 1: Grid-based Street View collection
 * Cover entire city with grid of points
 */
async function collectGridStreetView(cityName, lat, lon, gridSize = 0.01, points = 100) {
  console.log(`\n📍 Grid collection for ${cityName}...`);
  
  const cityDir = path.join(OUTPUT_DIR, cityName.toLowerCase().replace(/\s+/g, '-'));
  if (!fs.existsSync(cityDir)) {
    fs.mkdirSync(cityDir, { recursive: true });
  }
  
  const metadata = [];
  let collected = 0;
  
  // Create grid of points
  for (let i = 0; i < Math.sqrt(points); i++) {
    for (let j = 0; j < Math.sqrt(points); j++) {
      const pointLat = lat + (i - Math.sqrt(points)/2) * gridSize;
      const pointLon = lon + (j - Math.sqrt(points)/2) * gridSize;
      
      const filename = `grid_${cityName}_${i}_${j}.jpg`;
      const filepath = path.join(cityDir, filename);
      
      if (fs.existsSync(filepath)) continue;
      
      // Get Street View
      const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${pointLat},${pointLon}&key=${GOOGLE_API_KEY}`;
      
      try {
        const response = await axios.get(svUrl, { responseType: 'arraybuffer', timeout: 10000 });
        
        if (response.data.length > 5000) {
          fs.writeFileSync(filepath, response.data);
          
          // Reverse geocode to get address
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pointLat},${pointLon}&key=${GOOGLE_API_KEY}`;
          const geoResponse = await axios.get(geocodeUrl);
          const address = geoResponse.data.results[0]?.formatted_address || `${cityName} area`;
          
          metadata.push({
            filename,
            address,
            latitude: pointLat,
            longitude: pointLon,
            city: cityName,
            method: 'grid'
          });
          
          collected++;
          if (collected % 10 === 0) console.log(`✅ ${collected} collected`);
        }
      } catch (error) {
        // Skip failed points
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  fs.writeFileSync(
    path.join(cityDir, 'metadata.json'),
    JSON.stringify({ city: cityName, images: metadata }, null, 2)
  );
  
  console.log(`✅ ${cityName}: ${collected} images`);
  return metadata;
}

/**
 * Strategy 2: Popular places from Google Places API
 */
async function collectPopularPlaces(cityName, lat, lon, radius = 5000) {
  console.log(`\n🏢 Popular places for ${cityName}...`);
  
  const cityDir = path.join(OUTPUT_DIR, cityName.toLowerCase().replace(/\s+/g, '-'));
  const metadata = [];
  let collected = 0;
  
  // Search for different types of places
  const types = ['restaurant', 'cafe', 'store', 'bank', 'hotel', 'museum', 'park', 'school', 'hospital'];
  
  for (const type of types) {
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
    
    try {
      const response = await axios.get(placesUrl);
      const places = response.data.results || [];
      
      for (const place of places.slice(0, 5)) { // 5 per type
        const placeLat = place.geometry.location.lat;
        const placeLon = place.geometry.location.lng;
        const filename = `place_${place.place_id}.jpg`;
        const filepath = path.join(cityDir, filename);
        
        if (fs.existsSync(filepath)) continue;
        
        const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${placeLat},${placeLon}&key=${GOOGLE_API_KEY}`;
        const svResponse = await axios.get(svUrl, { responseType: 'arraybuffer', timeout: 10000 });
        
        if (svResponse.data.length > 5000) {
          fs.writeFileSync(filepath, svResponse.data);
          
          metadata.push({
            filename,
            address: place.vicinity || place.formatted_address,
            latitude: placeLat,
            longitude: placeLon,
            name: place.name,
            type: type,
            city: cityName,
            method: 'places'
          });
          
          collected++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Error with ${type}:`, error.message);
    }
  }
  
  console.log(`✅ ${cityName}: ${collected} places`);
  return metadata;
}

/**
 * Strategy 3: Multiple angles of same location
 */
async function collectMultiAngle(cityName, lat, lon, count = 20) {
  console.log(`\n📸 Multi-angle for ${cityName}...`);
  
  const cityDir = path.join(OUTPUT_DIR, cityName.toLowerCase().replace(/\s+/g, '-'));
  const metadata = [];
  let collected = 0;
  
  const headings = [0, 45, 90, 135, 180, 225, 270, 315]; // 8 directions
  
  for (let i = 0; i < count; i++) {
    const pointLat = lat + (Math.random() - 0.5) * 0.02;
    const pointLon = lon + (Math.random() - 0.5) * 0.02;
    
    for (const heading of headings) {
      const filename = `angle_${cityName}_${i}_${heading}.jpg`;
      const filepath = path.join(cityDir, filename);
      
      if (fs.existsSync(filepath)) continue;
      
      const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${pointLat},${pointLon}&heading=${heading}&key=${GOOGLE_API_KEY}`;
      
      try {
        const response = await axios.get(svUrl, { responseType: 'arraybuffer', timeout: 10000 });
        
        if (response.data.length > 5000) {
          fs.writeFileSync(filepath, response.data);
          
          // Get address once per location
          if (heading === 0) {
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pointLat},${pointLon}&key=${GOOGLE_API_KEY}`;
            const geoResponse = await axios.get(geocodeUrl);
            const address = geoResponse.data.results[0]?.formatted_address || `${cityName} area`;
            
            metadata.push({
              filename,
              address,
              latitude: pointLat,
              longitude: pointLon,
              heading,
              city: cityName,
              method: 'multi-angle'
            });
          }
          
          collected++;
        }
      } catch (error) {
        // Skip
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`✅ ${cityName}: ${collected} angles`);
  return metadata;
}

/**
 * Main massive collection
 */
async function main() {
  const cities = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198 }
  ];
  
  console.log('🚀 MASSIVE DATA COLLECTION\n');
  console.log('Strategies:');
  console.log('1. Grid-based Street View (100 points per city)');
  console.log('2. Popular places (45 per city)');
  console.log('3. Multi-angle views (160 per city)');
  console.log('Expected: ~3,000 images\n');
  
  const allMetadata = [];
  
  for (const city of cities) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`${city.name.toUpperCase()}`);
    console.log('='.repeat(50));
    
    // Strategy 1: Grid
    const gridData = await collectGridStreetView(city.name, city.lat, city.lon, 0.005, 100);
    allMetadata.push(...gridData);
    
    // Strategy 2: Places
    const placesData = await collectPopularPlaces(city.name, city.lat, city.lon);
    allMetadata.push(...placesData);
    
    // Strategy 3: Multi-angle
    const angleData = await collectMultiAngle(city.name, city.lat, city.lon, 20);
    allMetadata.push(...angleData);
    
    console.log(`\n✅ ${city.name} total: ${gridData.length + placesData.length + angleData.length}`);
  }
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-metadata.json'),
    JSON.stringify(allMetadata, null, 2)
  );
  
  console.log(`\n\n${'='.repeat(50)}`);
  console.log('🎉 COLLECTION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`📊 Total images: ${allMetadata.length}`);
  console.log(`📁 Location: ${OUTPUT_DIR}`);
  console.log(`\nNext: node scripts/data-collection/train-massive.js`);
}

main().catch(console.error);
