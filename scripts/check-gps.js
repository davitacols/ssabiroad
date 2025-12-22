const ExifReader = require('exifreader');
const fs = require('fs');
const path = require('path');

async function checkGPSTags(imagePath) {
  try {
    const buffer = fs.readFileSync(imagePath);
    const tags = ExifReader.load(buffer);
    
    const hasGPS = !!(tags.GPSLatitude || tags.GPSLongitude);
    
    return {
      file: path.basename(imagePath),
      hasGPS,
      lat: tags.GPSLatitude?.description,
      lng: tags.GPSLongitude?.description
    };
  } catch (e) {
    return { file: path.basename(imagePath), hasGPS: false, error: e.message };
  }
}

async function scanDirectory(dir, limit = 10) {
  const results = [];
  const files = fs.readdirSync(dir, { recursive: true })
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .slice(0, limit);
  
  for (const file of files) {
    const result = await checkGPSTags(path.join(dir, file));
    results.push(result);
    console.log(`${result.file}: ${result.hasGPS ? '✓ GPS' : '✗ No GPS'} ${result.lat || ''} ${result.lng || ''}`);
  }
  
  const withGPS = results.filter(r => r.hasGPS).length;
  console.log(`\n${withGPS}/${results.length} images have GPS tags`);
}

const dir = process.argv[2] || path.join(__dirname, '..', 'data', 'daily-collection');
scanDirectory(dir);
