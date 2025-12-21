const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOWNLOAD_URL = 'https://s3.dualstack.us-east-1.amazonaws.com/production-raw-data-api/ISO3/NGA/buildings/polygons/hotosm_nga_buildings_polygons_shp.zip';
const OUTPUT_DIR = path.join(__dirname, '../../data/hotosm_nga');
const ZIP_FILE = path.join(OUTPUT_DIR, 'buildings.zip');
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY';
const ML_API_URL = 'http://34.224.33.158:8000/train';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📥 Downloading HOT OSM Nigeria buildings (1.4GB)...');
console.log('This will take several minutes...\n');

const file = fs.createWriteStream(ZIP_FILE);
let downloaded = 0;

https.get(DOWNLOAD_URL, (response) => {
  const totalSize = parseInt(response.headers['content-length'], 10);
  
  response.on('data', (chunk) => {
    downloaded += chunk.length;
    const percent = ((downloaded / totalSize) * 100).toFixed(1);
    process.stdout.write(`\r📊 Progress: ${percent}% (${(downloaded / 1024 / 1024).toFixed(0)}MB / ${(totalSize / 1024 / 1024).toFixed(0)}MB)`);
  });

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('\n✅ Download complete!\n');
    
    console.log('📦 Extracting shapefile...');
    try {
      execSync(`powershell -command "Expand-Archive -Path '${ZIP_FILE}' -DestinationPath '${OUTPUT_DIR}' -Force"`, { stdio: 'inherit' });
      console.log('✅ Extraction complete!\n');
      
      console.log('📍 Next steps:');
      console.log('1. Install GDAL: npm install gdal');
      console.log('2. Run: node scripts/data-collection/process-hotosm.js');
      console.log('\nThis will:');
      console.log('- Parse shapefile with building coordinates');
      console.log('- Sample buildings across Nigeria');
      console.log('- Collect Street View images');
      console.log('- Train ML model with real addresses');
    } catch (error) {
      console.error('❌ Extraction failed:', error.message);
      console.log('\nManually extract the ZIP file to:', OUTPUT_DIR);
    }
  });
}).on('error', (err) => {
  fs.unlink(ZIP_FILE, () => {});
  console.error('❌ Download failed:', err.message);
});
