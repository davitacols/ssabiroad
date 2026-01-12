# Navisense V2 - Quick Start Guide

## Phase 3 Complete! 🎉

All systems are ready. Follow these steps to start using Navisense ML.

## Step 1: Start ML Service

Open a new terminal:

```bash
cd d:\ssabiroad\navisense-ml
python app.py
```

You should see:
```
Loading CLIP model...
CLIP model loaded on cpu
Connected to Pinecone index: navisense-locations
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 2: Verify ML Service

Open another terminal:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "model": "CLIP ViT-B/32",
  "device": "cpu",
  "vectors_in_db": 0
}
```

## Step 3: Check Training Data

```bash
curl http://localhost:3000/api/navisense/training-data
```

You should see 10 verified recognitions ready for training.

## Step 4: Upload a Test Image

1. Go to http://localhost:3000
2. Upload an image
3. Watch the logs - you'll see:
   - "Step 2: Trying Navisense ML prediction..."
   - "Image uploaded to S3: https://..."
   - "Recognition saved successfully"

## Step 5: Provide Feedback

1. Mark the location as correct/incorrect
2. This adds it to the training queue

## Step 6: Sync Training Data (Once You Have Images)

```bash
curl -X POST http://localhost:8000/sync-training
```

This will:
- Fetch verified recognitions from database
- Download images from S3
- Generate CLIP embeddings
- Store in Pinecone

## Step 7: Test Predictions

Upload a similar image and watch Navisense ML predict the location!

## Monitoring

### Check Stats
```bash
curl http://localhost:8000/stats
```

### Check Training Data
```bash
curl http://localhost:3000/api/navisense/training-data
```

### View Logs
- ML Service: Terminal running `python app.py`
- Next.js: Terminal running `npm run dev`

## Troubleshooting

### "Connection refused" on port 8000
→ ML service not running. Start it: `cd navisense-ml && python app.py`

### "No similar locations found"
→ No training data in Pinecone yet. Upload images and run sync.

### "S3 upload failed"
→ Check AWS credentials in `.env.local`

## What's Happening Behind the Scenes

1. **Image Upload** → Stored in S3
2. **Recognition** → Saved to database with S3 URL
3. **Feedback** → Marks as verified training data
4. **Sync** → Downloads from S3, generates embeddings, stores in Pinecone
5. **Prediction** → Queries Pinecone for similar images, returns location

## Success! 🚀

You now have a fully functional ML-powered location recognition system that learns from user feedback!
