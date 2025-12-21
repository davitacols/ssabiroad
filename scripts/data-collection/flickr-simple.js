const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FLICKR_API_KEY = '9456f3e34624ba3d0f1a5b7cf794c4fa230ed5d004527ea45d862aef658167c6'; // Use your CRON_SECRET as temp key
const OUTPUT_DIR = path.join(__dirname, '../../data/flickr-collected');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function searchGeotaggedPhotos(lat, lon, radius = 5, perPage = 30) {
  const url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${FLICKR_API_KEY}&lat=${lat}&lon=${lon}&radius=${radius}&has_geo=1&per_page=${perPage}&format=json&nojsoncallback=1&extras=geo,url_m,url_l,description`;
  
  try {
    const response = await axios.get(url);
    return response.data.photos?.photo || [];
  } catch (error) {
    console.error('Flickr API error:', error.message);
    return [];
  }
}

async function downloadImage(url, filepath) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    fs.writeFileSync(filepath, response.data);
    return true;
  } catch (error) {
    console.error(`Download failed: ${error.message}`);
    return false;
  }
}

async function collectCity(cityName, lat, lon) {
  console.log(`\n📍 Collecting ${cityName}...`);
  
  const cityDir = path.join(OUTPUT_DIR, cityName.toLowerCase().replace(/\s+/g, '-'));
  if (!fs.existsSync(cityDir)) {
    fs.mkdirSync(cityDir, { recursive: true });
  }
  
  const photos = await searchGeotaggedPhotos(lat, lon);
  console.log(`Found ${photos.length} photos`);
  
  const metadata = [];
  let downloaded = 0;
  
  for (const photo of photos) {
    const imageUrl = photo.url_l || photo.url_m;
    if (!imageUrl) continue;
    
    const filename = `${photo.id}.jpg`;
    const filepath = path.join(cityDir, filename);
    
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skip: ${filename}`);
      continue;
    }
    
    const success = await downloadImage(imageUrl, filepath);
    if (success) {
      metadata.push({
        id: photo.id,
        filename,
        latitude: parseFloat(photo.latitude),
        longitude: parseFloat(photo.longitude),
        title: photo.title,
        description: photo.description?._content || '',
        city: cityName,
        url: `https://www.flickr.com/photos/${photo.owner}/${photo.id}`
      });
      downloaded++;
      console.log(`✅ ${downloaded}/${photos.length}: ${filename}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  fs.writeFileSync(
    path.join(cityDir, 'metadata.json'),
    JSON.stringify({ city: cityName, images: metadata }, null, 2)
  );
  
  return metadata;
}

async function main() {
  const cities = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708 }
  ];
  
  console.log('🚀 Starting Flickr collection...\n');
  
  const allMetadata = [];
  for (const city of cities) {
    const metadata = await collectCity(city.name, city.lat, city.lon);
    allMetadata.push(...metadata);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-metadata.json'),
    JSON.stringify(allMetadata, null, 2)
  );
  
  console.log(`\n✅ Collected ${allMetadata.length} images`);
  console.log('Next: node scripts/data-collection/enrich-addresses.js');
}

main().catch(console.error);
