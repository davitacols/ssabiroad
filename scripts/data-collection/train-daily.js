const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

const ML_API_URL = 'http://34.224.33.158:8000';
const OUTPUT_DIR = path.join(__dirname, '../../data/daily-collection');

async function trainDaily() {
  // Find today's metadata file
  const today = new Date().toISOString().split('T')[0];
  const metadataFile = path.join(OUTPUT_DIR, `metadata_${today}.json`);
  
  if (!fs.existsSync(metadataFile)) {
    console.error('❌ No data collected today. Run collect-daily.js first.');
    process.exit(1);
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
  console.log(`📤 Uploading ${metadata.length} images from today...\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const item of metadata) {
    const locationDir = path.join(OUTPUT_DIR, item.state.toLowerCase(), item.location.toLowerCase().replace(/\s+/g, '-'));
    const filepath = path.join(locationDir, item.filename);
    
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
      date: item.date,
      source: 'daily-collection'
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
  console.log('📊 UPLOAD COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success rate: ${((success/metadata.length)*100).toFixed(1)}%`);
}

trainDaily().catch(console.error);
