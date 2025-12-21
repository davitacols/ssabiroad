// Send Wikimedia collected data to ML API for training
const fs = require('fs');
const path = require('path');
const http = require('http');

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';
const METADATA_FILE = path.join(__dirname, '../../data/wikimedia-collected/all-metadata.json');

async function sendToMLAPI() {
  console.log('🚀 Sending collected data to ML API...\n');
  
  if (!fs.existsSync(METADATA_FILE)) {
    console.error('❌ Metadata file not found. Run wikimedia-collector.js first.');
    process.exit(1);
  }
  
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  console.log(`📊 Found ${metadata.length} images to train\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < metadata.length; i++) {
    const item = metadata[i];
    
    try {
      const cityDir = item.city.toLowerCase().replace(/\s+/g, '-');
      const imagePath = path.join(__dirname, '../../data/wikimedia-collected', cityDir, item.filename);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`⚠️  Image not found: ${imagePath}`);
        continue;
      }
      
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('file', fs.createReadStream(imagePath));
      formData.append('latitude', item.latitude.toString());
      formData.append('longitude', item.longitude.toString());
      formData.append('metadata', JSON.stringify({
        address: item.address || item.title || item.city,
        source: 'wikimedia',
        city: item.city,
        license: item.license,
        description: item.description
      }));
      
      await new Promise((resolve, reject) => {
        const url = new URL('/train', ML_API_URL);
        const options = {
          hostname: url.hostname,
          port: url.port || 8000,
          path: url.pathname,
          method: 'POST',
          headers: formData.getHeaders()
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              successCount++;
              console.log(`✅ [${successCount}/${metadata.length}] Trained: ${item.filename} (${item.city})`);
              resolve();
            } else {
              errorCount++;
              console.log(`❌ [${i+1}/${metadata.length}] Failed: ${item.filename}`);
              resolve();
            }
          });
        });
        
        req.on('error', (err) => {
          errorCount++;
          console.error(`❌ Error: ${err.message}`);
          resolve();
        });
        
        formData.pipe(req);
      });
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      errorCount++;
      console.error(`❌ Error processing ${item.filename}:`, err.message);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Training Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully trained: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📈 Success rate: ${((successCount/metadata.length)*100).toFixed(1)}%`);
  console.log('\n🎉 Training complete!');
}

// Check if form-data is installed
try {
  require('form-data');
} catch (err) {
  console.error('❌ form-data package not found. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install form-data', { stdio: 'inherit' });
}

sendToMLAPI().catch(console.error);
