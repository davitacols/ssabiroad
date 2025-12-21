const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

const ML_API_URL = 'http://34.224.33.158:8000';
const METADATA_FILE = path.join(__dirname, '../../data/nigeria-massive/all-metadata.json');

async function sendToML() {
  if (!fs.existsSync(METADATA_FILE)) {
    console.error('❌ Run collect-nigeria-massive.js first');
    process.exit(1);
  }
  
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  console.log(`🇳🇬 Uploading ${metadata.length} Nigerian images...\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const item of metadata) {
    const locationDir = item.location.toLowerCase().replace(/\s+/g, '-');
    const filepath = path.join(__dirname, '../../data/nigeria-massive', locationDir, item.filename);
    
    if (!fs.existsSync(filepath)) {
      failed++;
      continue;
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filepath));
    formData.append('latitude', item.latitude.toString());
    formData.append('longitude', item.longitude.toString());
    formData.append('metadata', JSON.stringify({
      address: item.address,
      location: item.location,
      state: item.state,
      heading: item.heading,
      country: 'Nigeria',
      source: 'nigeria-massive'
    }));
    
    await new Promise((resolve) => {
      const req = http.request({
        hostname: '34.224.33.158',
        port: 8000,
        path: '/train',
        method: 'POST',
        headers: formData.getHeaders()
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            success++;
            if (success % 100 === 0) {
              console.log(`✅ ${success}/${metadata.length} (${((success/metadata.length)*100).toFixed(1)}%)`);
            }
          } else {
            failed++;
          }
          resolve();
        });
      });
      
      req.on('error', () => {
        failed++;
        resolve();
      });
      
      formData.pipe(req);
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('🇳🇬 NIGERIA TRAINING COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success rate: ${((success/metadata.length)*100).toFixed(1)}%`);
}

sendToML().catch(console.error);
