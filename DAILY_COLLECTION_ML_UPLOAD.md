# Daily Collection ML Training Upload

This system sends images from `/data/daily-collection` to the ML training system with their correct addresses.

## Overview

The daily collection contains street view images with metadata (addresses, coordinates, locations). This system pairs each image with its metadata and sends it to the ML API for training.

## Files Created

1. **`scripts/send-daily-collection-to-ml.js`** - Node.js script for batch upload
2. **`app/api/ml/upload-daily-collection/route.ts`** - API endpoint for web-based upload

## Usage

### Option 1: Command Line Script

Run the Node.js script directly:

```bash
node scripts/send-daily-collection-to-ml.js
```

Features:
- Processes images in batches of 10
- Shows progress with detailed logging
- Displays success/failure statistics
- 1 second delay between batches to avoid overwhelming the ML server

### Option 2: API Endpoint

#### List Available Collections
```bash
curl https://ssabiroad.vercel.app/api/ml/upload-daily-collection
```

Response:
```json
{
  "success": true,
  "collections": [
    {
      "date": "2025-12-22",
      "imageCount": 800,
      "file": "metadata_2025-12-22.json"
    }
  ]
}
```

#### Upload Collection
```bash
curl -X POST https://ssabiroad.vercel.app/api/ml/upload-daily-collection \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-22"}'
```

Response:
```json
{
  "success": true,
  "message": "Daily collection uploaded to ML",
  "stats": {
    "total": 800,
    "successful": 795,
    "failed": 5,
    "successRate": 99
  },
  "results": [
    {
      "filename": "Lagos_Island_0_0_0.jpg",
      "status": "success",
      "address": "C9MF+JV Lagos, Nigeria"
    }
  ]
}
```

## Data Structure

### Metadata Format
Each image has associated metadata:
```json
{
  "filename": "Lagos_Island_0_0_0.jpg",
  "address": "C9MF+JV Lagos, Nigeria",
  "latitude": 6.434100000000001,
  "longitude": 3.3747,
  "heading": 0,
  "location": "Lagos Island",
  "state": "Lagos",
  "date": "2025-12-22T01:00:34.826Z"
}
```

### ML API Payload
Each image is sent with:
- **file**: Image file stream
- **metadata**: JSON containing address, coordinates, location, state, heading, date

## Configuration

Environment variable:
```env
ML_API_URL=http://52.91.173.191:8000
```

Default endpoint: `/add_to_index`

## Processing Details

- **Batch Size**: 10 images per batch
- **Delay**: 1000ms between batches
- **Retry**: No automatic retry (failed images are logged)
- **Validation**: Only processes images that have metadata entries

## Monitoring

The script provides real-time progress:
```
🚀 Starting daily collection ML training upload...

📊 Found 800 images in metadata

🖼️  Found 800 images to process

📦 Processing batch 1/80
  ⏳ Sending: Lagos_Island_0_0_0.jpg
     Address: C9MF+JV Lagos, Nigeria
  ✅ Success: Lagos_Island_0_0_0.jpg

📈 Progress: 10/800 (1%)
   ✅ Successful: 10
   ❌ Failed: 0

⏸️  Waiting 1000ms before next batch...
```

## Integration with ML Training System

After upload, images are:
1. Added to the ML index via `/add_to_index` endpoint
2. Queued for training (check `/api/ml/training-queue`)
3. Processed during next training cycle (automatic every 6 hours or manual trigger)

## Troubleshooting

### Metadata file not found
Ensure the metadata file exists: `/data/daily-collection/metadata_2025-12-22.json`

### ML API connection failed
Check:
- ML server is running: `http://52.91.173.191:8000`
- Network connectivity
- ML_API_URL environment variable

### Images not found
Verify images exist in `/data/daily-collection/` and match filenames in metadata

## Next Steps

After uploading:
1. Check training queue: `GET /api/ml/training-queue`
2. Monitor training status: `GET /api/ml/training-status`
3. Trigger training manually: `POST /api/ml/train`
4. View dashboard: `/ml-training`

## Example Workflow

```bash
# 1. List available collections
curl https://ssabiroad.vercel.app/api/ml/upload-daily-collection

# 2. Upload specific date
curl -X POST https://ssabiroad.vercel.app/api/ml/upload-daily-collection \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-22"}'

# 3. Check training queue
curl https://ssabiroad.vercel.app/api/ml/training-queue

# 4. Trigger training
curl -X POST https://ssabiroad.vercel.app/api/ml/train

# 5. Monitor progress
curl https://ssabiroad.vercel.app/api/ml/training-status
```
