// Flickr Data Collector for Pic2Nav
// Fetches geotagged images from Flickr API

const https = require('https');
const fs = require('fs');
const path = require('path');

const FLICKR_API_KEY = process.env.FLICKR_API_KEY || 'YOUR_API_KEY_HERE';
const OUTPUT_DIR = path.join(__dirname, '../../data/flickr-collected');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Search for geotagged photos in a specific location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in km (max 32)
 * @param {number} perPage - Results per page (max 500)
 */
async function searchGeotaggedPhotos(lat, lon, radius = 5, perPage = 100) {
  const url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${FLICKR_API_KEY}&lat=${lat}&lon=${lon}&radius=${radius}&has_geo=1&extras=geo,url_o,url_l,url_m,description,tags,date_taken&per_page=${perPage}&format=json&nojsoncallback=1`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.stat === 'ok') {
            resolve(result.photos.photo);
          } else {
            reject(new Error(result.message || 'Flickr API error'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get photo info including location data
 */
async function getPhotoInfo(photoId) {
  const url = `https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=${FLICKR_API_KEY}&photo_id=${photoId}&format=json&nojsoncallback=1`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.stat === 'ok' ? result.photo : null);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Download image from URL
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

/**
 * Collect data for a specific city/location
 */
async function collectLocationData(cityName, lat, lon, targetCount = 100) {
  console.log(`\n🌍 Collecting data for ${cityName} (${lat}, ${lon})...`);
  
  const cityDir = path.join(OUTPUT_DIR, cityName.toLowerCase().replace(/\s+/g, '-'));
  if (!fs.existsSync(cityDir)) {
    fs.mkdirSync(cityDir, { recursive: true });
  }
  
  const metadataFile = path.join(cityDir, 'metadata.json');
  const metadata = [];
  
  try {
    const photos = await searchGeotaggedPhotos(lat, lon, 10, Math.min(targetCount, 500));
    console.log(`✅ Found ${photos.length} photos`);
    
    let downloaded = 0;
    for (const photo of photos.slice(0, targetCount)) {
      try {
        const imageUrl = photo.url_l || photo.url_m || photo.url_o;
        if (!imageUrl) continue;
        
        const filename = `${photo.id}.jpg`;
        const filepath = path.join(cityDir, filename);
        
        // Skip if already downloaded
        if (fs.existsSync(filepath)) {
          console.log(`⏭️  Skipping ${filename} (already exists)`);
          continue;
        }
        
        await downloadImage(imageUrl, filepath);
        
        metadata.push({
          id: photo.id,
          filename,
          latitude: parseFloat(photo.latitude),
          longitude: parseFloat(photo.longitude),
          title: photo.title,
          description: photo.description?._content || '',
          tags: photo.tags,
          dateTaken: photo.datetaken,
          url: `https://www.flickr.com/photos/${photo.owner}/${photo.id}`,
          license: photo.license,
          city: cityName
        });
        
        downloaded++;
        console.log(`📥 Downloaded ${downloaded}/${targetCount}: ${filename}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Error downloading photo ${photo.id}:`, err.message);
      }
    }
    
    // Save metadata
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    console.log(`\n✅ Collected ${downloaded} images for ${cityName}`);
    console.log(`📄 Metadata saved to ${metadataFile}`);
    
    return metadata;
    
  } catch (err) {
    console.error(`❌ Error collecting data for ${cityName}:`, err.message);
    return [];
  }
}

/**
 * Main collection function - collect data for multiple cities
 */
async function collectMultipleCities() {
  const cities = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { name: 'Toronto', lat: 43.6532, lon: -79.3832 }
  ];
  
  console.log('🚀 Starting Flickr data collection...');
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
  
  const allMetadata = [];
  
  for (const city of cities) {
    const metadata = await collectLocationData(city.name, city.lat, city.lon, 50);
    allMetadata.push(...metadata);
    
    // Pause between cities
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save combined metadata
  const combinedFile = path.join(OUTPUT_DIR, 'all-metadata.json');
  fs.writeFileSync(combinedFile, JSON.stringify(allMetadata, null, 2));
  
  console.log(`\n\n🎉 Collection complete!`);
  console.log(`📊 Total images collected: ${allMetadata.length}`);
  console.log(`📄 Combined metadata: ${combinedFile}`);
}

// Run if called directly
if (require.main === module) {
  if (!FLICKR_API_KEY || FLICKR_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ Error: FLICKR_API_KEY not set!');
    console.log('\n📝 To get a Flickr API key:');
    console.log('1. Go to https://www.flickr.com/services/apps/create/apply/');
    console.log('2. Create a non-commercial app');
    console.log('3. Set FLICKR_API_KEY environment variable');
    console.log('\nExample: set FLICKR_API_KEY=your_key_here');
    process.exit(1);
  }
  
  collectMultipleCities().catch(console.error);
}

module.exports = { searchGeotaggedPhotos, collectLocationData, downloadImage };
