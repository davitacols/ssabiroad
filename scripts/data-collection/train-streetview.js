const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

const ML_API_URL = 'http://34.224.33.158:8000';
const METADATA_FILE = path.join(__dirname, '../../data/streetview-collected/all-metadata.json');

async function sendToML() {
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  console.log(`📤 Sending ${metadata.length} images...\n`);
  
  let success = 0;
  
  for (const item of metadata) {
    const filepath = path.join(__dirname, '../../data/streetview-collected', item.filename);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filepath));
    formData.append('latitude', item.latitude.toString());
    formData.append('longitude', item.longitude.toString());
    formData.append('metadata', JSON.stringify({ 
      address: item.address,
      name: item.name, 
      source: 'streetview' 
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
            console.log(`✅ ${success}/${metadata.length}: ${item.name}`);
          } else {
            console.log(`❌ Failed: ${item.name}`);
          }
          resolve();
        });
      });
      
      req.on('error', (err) => {
        console.error(`❌ Error: ${err.message}`);
        resolve();
      });
      
      formData.pipe(req);
    });
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n✅ Sent ${success}/${metadata.length} images with proper addresses!`);
}

sendToML().catch(console.error);
