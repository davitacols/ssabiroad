// Wikimedia Commons Data Collector for Pic2Nav
// Fetches geotagged images from Wikimedia Commons

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../data/wikimedia-collected');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Search for geotagged images near a location
 */
async function searchGeotaggedImages(lat, lon, radius = 5000, limit = 50) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=${radius}&gslimit=${limit}&gsnamespace=6&format=json`;
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Pic2Nav/1.0 (https://ssabiroad.com; contact@ssabiroad.com)'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.query?.geosearch || []);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get image info and URL
 */
async function getImageInfo(pageId) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&pageids=${pageId}&prop=imageinfo|coordinates&iiprop=url|extmetadata|size&iiurlwidth=1024&format=json`;
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Pic2Nav/1.0 (https://ssabiroad.com; contact@ssabiroad.com)'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const page = result.query?.pages?.[pageId];
          resolve(page || null);
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
    const options = {
      headers: {
        'User-Agent': 'Pic2Nav/1.0 (https://ssabiroad.com; contact@ssabiroad.com)'
      }
    };
    https.get(url, options, (res) => {
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
 * Collect data for a specific location
 */
async function collectLocationData(cityName, lat, lon, targetCount = 50) {
  console.log(`\n🌍 Collecting Wikimedia data for ${cityName} (${lat}, ${lon})...`);
  
  const cityDir = path.join(OUTPUT_DIR, cityName.toLowerCase().replace(/\s+/g, '-'));
  if (!fs.existsSync(cityDir)) {
    fs.mkdirSync(cityDir, { recursive: true });
  }
  
  const metadataFile = path.join(cityDir, 'metadata.json');
  const metadata = [];
  
  try {
    const results = await searchGeotaggedImages(lat, lon, 10000, targetCount);
    console.log(`✅ Found ${results.length} geotagged pages`);
    
    let downloaded = 0;
    for (const result of results) {
      try {
        const pageInfo = await getImageInfo(result.pageid);
        
        if (!pageInfo?.imageinfo?.[0]) continue;
        
        const imageInfo = pageInfo.imageinfo[0];
        const coords = pageInfo.coordinates?.[0];
        
        // Use url or thumburl
        const imageUrl = imageInfo.url || imageInfo.thumburl;
        
        if (!coords || !imageUrl) {
          console.log(`⏭️  Skipping ${result.pageid} (no coords or URL)`);
          continue;
        }
        
        const filename = `${result.pageid}.jpg`;
        const filepath = path.join(cityDir, filename);
        
        // Skip if already downloaded
        if (fs.existsSync(filepath)) {
          console.log(`⏭️  Skipping ${filename} (already exists)`);
          continue;
        }
        
        await downloadImage(imageUrl, filepath);
        
        const extMetadata = imageInfo.extmetadata || {};
        
        metadata.push({
          id: result.pageid,
          filename,
          latitude: coords.lat,
          longitude: coords.lon,
          title: result.title.replace('File:', ''),
          description: extMetadata.ImageDescription?.value || '',
          artist: extMetadata.Artist?.value || '',
          license: extMetadata.LicenseShortName?.value || 'Unknown',
          url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title.replace('File:', ''))}`,
          city: cityName,
          width: imageInfo.width,
          height: imageInfo.height
        });
        
        downloaded++;
        console.log(`📥 Downloaded ${downloaded}/${targetCount}: ${filename}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (err) {
        console.error(`❌ Error processing page ${result.pageid}:`, err.message);
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
 * Main collection function
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
  
  console.log('🚀 Starting Wikimedia Commons data collection...');
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
  
  const allMetadata = [];
  
  for (const city of cities) {
    const metadata = await collectLocationData(city.name, city.lat, city.lon, 30);
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
  collectMultipleCities().catch(console.error);
}

module.exports = { searchGeotaggedImages, collectLocationData, downloadImage };
