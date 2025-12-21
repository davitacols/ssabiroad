# Pic2Nav Data Collection System

Automated data collection from Flickr and Wikimedia Commons to train the location recognition AI.

## 🎯 Overview

This system collects geotagged images from public sources to improve Pic2Nav's AI accuracy:
- **Flickr**: User-uploaded photos with GPS coordinates
- **Wikimedia Commons**: Free-use images with location metadata

## 🚀 Quick Start

### 1. Get Flickr API Key (Optional but Recommended)

1. Visit: https://www.flickr.com/services/apps/create/apply/
2. Create a non-commercial app
3. Copy your API Key

### 2. Set Environment Variable

**Windows:**
```bash
set FLICKR_API_KEY=your_key_here
```

**Linux/Mac:**
```bash
export FLICKR_API_KEY=your_key_here
```

### 3. Run Collection

**Collect from both sources:**
```bash
node scripts/data-collection/collect-all.js
```

**Collect from Flickr only:**
```bash
node scripts/data-collection/flickr-collector.js
```

**Collect from Wikimedia only:**
```bash
node scripts/data-collection/wikimedia-collector.js
```

**Collect and send to ML API:**
```bash
node scripts/data-collection/collect-all.js --send-to-api
```

## 📁 Output Structure

```
data/
├── flickr-collected/
│   ├── new-york/
│   │   ├── 12345.jpg
│   │   ├── 12346.jpg
│   │   └── metadata.json
│   ├── london/
│   └── all-metadata.json
│
└── wikimedia-collected/
    ├── new-york/
    │   ├── 67890.jpg
    │   └── metadata.json
    └── all-metadata.json
```

## 📊 Metadata Format

Each image includes:
```json
{
  "id": "12345",
  "filename": "12345.jpg",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "title": "Empire State Building",
  "description": "View from street level",
  "city": "New York",
  "source": "flickr",
  "license": "CC BY 2.0",
  "url": "https://flickr.com/photos/..."
}
```

## 🎯 Target Cities

Default collection targets:
- New York, USA
- London, UK
- Paris, France
- Tokyo, Japan
- Lagos, Nigeria
- Dubai, UAE
- Sydney, Australia
- Toronto, Canada

## ⚙️ Customization

### Add More Cities

Edit `collect-all.js`:
```javascript
const cities = [
  { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  // Add more...
];
```

### Adjust Collection Size

```javascript
// Collect 100 images per city instead of 30
await collectLocationData(city.name, city.lat, city.lon, 100);
```

### Change Search Radius

```javascript
// Search within 10km instead of 5km
await searchGeotaggedPhotos(lat, lon, 10, perPage);
```

## 🔄 Integration with ML Training

### Automatic Training

The collected data is automatically formatted for ML training:

```bash
# Collect and train in one command
node scripts/data-collection/collect-all.js --send-to-api
```

### Manual Training

1. Collect data first:
```bash
node scripts/data-collection/collect-all.js
```

2. Training manifest is created at:
```
ml-models/data/collected/training-manifest.json
```

3. Use the manifest with your ML training pipeline

## 📈 Expected Results

Per city collection (default settings):
- **Flickr**: ~30-50 images
- **Wikimedia**: ~20-30 images
- **Total per city**: ~50-80 images

For 8 cities:
- **Total images**: ~400-640 images
- **Collection time**: ~15-20 minutes
- **Storage**: ~200-500 MB

## 🔒 Legal & Compliance

### Flickr
- Uses public API
- Respects Creative Commons licenses
- Attribution preserved in metadata

### Wikimedia Commons
- All images are free-use
- License information included
- Proper attribution maintained

### Best Practices
✅ Only collect public, geotagged images
✅ Respect rate limits
✅ Store license information
✅ Provide attribution
✅ Don't collect private/sensitive locations

## 🐛 Troubleshooting

### "FLICKR_API_KEY not set"
- Get API key from Flickr
- Set environment variable before running

### "No images found"
- Try increasing search radius
- Check if location has geotagged photos
- Verify coordinates are correct

### "Download failed"
- Check internet connection
- Some images may be removed/unavailable
- Script will skip and continue

### "Rate limit exceeded"
- Increase delay between requests
- Reduce images per batch
- Wait and retry later

## 📊 Monitoring Progress

The scripts provide real-time feedback:
```
🌍 Collecting data for New York (40.7128, -74.0060)...
✅ Found 150 photos
📥 Downloaded 1/50: 12345.jpg
📥 Downloaded 2/50: 12346.jpg
...
✅ Collected 50 images for New York
📄 Metadata saved to data/flickr-collected/new-york/metadata.json
```

## 🚀 Next Steps

After collecting data:

1. **Review Quality**: Check collected images
2. **Train Model**: Send to ML API or train locally
3. **Validate Results**: Test with new images
4. **Expand Coverage**: Add more cities
5. **Automate**: Set up scheduled collection

## 💡 Tips

- Run collection during off-peak hours
- Start with fewer cities to test
- Monitor disk space
- Keep metadata files for reference
- Regular collection improves AI over time

## 🤝 Contributing

To add new data sources:
1. Create new collector script
2. Follow existing format
3. Update `collect-all.js`
4. Document in README

## 📞 Support

Issues? Check:
- API keys are valid
- Internet connection is stable
- Disk space is available
- Coordinates are correct

---

**Happy Collecting! 🎉**
