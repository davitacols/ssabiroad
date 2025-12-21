const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

const ML_API_URL = 'http://34.224.33.158:8000';
const METADATA_FILE = path.join(__dirname, '../../data/massive-collected/all-metadata.json');

async function sendToML() {
  if (!fs.existsSync(METADATA_FILE)) {
    console.error('❌ Run collect-massive.js first');
    process.exit(1);
  }
  
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  console.log(`📤 Sending ${metadata.length} images to ML API...\n`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < metadata.length; i++) {
    const item = metadata[i];
    const cityDir = item.city.toLowerCase().replace(/\s+/g, '-');
    const filepath = path.join(__dirname, '../../data/massive-collected', cityDir, item.filename);
    
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
      name: item.name || '',
      city: item.city,
      method: item.method,
      type: item.type || '',
      heading: item.heading || 0,
      source: 'massive-collection'
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
            if (success % 50 === 0) {
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
    
    await new Promise(resolve => setTimeout(resolve, 50)); // Fast upload
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 TRAINING SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success rate: ${((success/metadata.length)*100).toFixed(1)}%`);
  console.log(`\n🎉 Upload complete!`);
}

sendToML().catch(console.error);
