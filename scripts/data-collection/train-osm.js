const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

const ML_API_URL = 'http://34.224.33.158:8000';
const METADATA_FILE = path.join(__dirname, '../../data/osm-collected/all-metadata.json');

async function sendToML() {
  if (!fs.existsSync(METADATA_FILE)) {
    console.error('❌ Run collect-osm.js first');
    process.exit(1);
  }
  
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  console.log(`📤 Sending ${metadata.length} OSM buildings...\n`);
  
  let success = 0;
  
  for (const item of metadata) {
    const cityDir = item.city.toLowerCase().replace(/\s+/g, '-');
    const filepath = path.join(__dirname, '../../data/osm-collected', cityDir, item.filename);
    
    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  Skip: ${item.filename} not found`);
      continue;
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filepath));
    formData.append('latitude', item.latitude.toString());
    formData.append('longitude', item.longitude.toString());
    formData.append('metadata', JSON.stringify({
      address: item.address,
      name: item.name,
      building_type: item.building_type,
      city: item.city,
      source: 'osm-streetview'
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
            console.log(`✅ ${success}/${metadata.length}: ${item.address}`);
          } else {
            console.log(`❌ Failed: ${item.address}`);
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
  
  console.log(`\n✅ Sent ${success}/${metadata.length} buildings with addresses!`);
}

sendToML().catch(console.error);
