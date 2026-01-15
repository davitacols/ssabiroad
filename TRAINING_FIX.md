# Training System Fix

## Problem
The Navisense training was failing with "fetch failed" error because:
1. The ML API URL was pointing to an old EC2 instance (`http://34.224.33.158:8000`)
2. The code was calling `/feedback` endpoint which didn't exist
3. The Navisense ML API (`app.py`) only had `/predict` endpoint, no training endpoint
4. Image data wasn't being passed to the training function

## Why Training is Needed
The ML model needs training to:
- **Learn from verified detections** - Store user-confirmed correct locations in Pinecone
- **Build knowledge base** - Accumulate verified examples over time
- **Improve accuracy** - Each verified image becomes a training example
- **Enable similarity matching** - Store vector embeddings for visual similarity search

## Solution

### 1. Added `/train` Endpoint to Navisense ML API
**File: `navisense-ml/app.py`**
- Added new `/train` endpoint that accepts:
  - `file`: Image file
  - `latitude`: Location latitude
  - `longitude`: Location longitude
  - `address`: Optional address
  - `businessName`: Optional business name
- Generates embedding from image
- Stores vector in Pinecone with metadata
- Returns success status and total vector count

### 2. Updated Training Function
**File: `app/api/location-feedback/training.ts`**
- Changed ML_API_URL to use `NAVISENSE_ML_URL` (https://ssabiroad.onrender.com)
- Updated endpoint from `/feedback` to `/train`
- Added `imageBuffer` parameter to `trainModelWithFeedback()`
- Sends image as multipart form data with location metadata
- Increased timeout to 15 seconds

### 3. Fixed Function Calls
**File: `app/api/location-feedback/route.ts`**
- Updated call to pass `imageBuffer` to `trainModelWithFeedback()`

**File: `app/api/location-feedback/training.ts`**
- Enabled ML training in `saveFeedback()` function
- Now calls `trainModelWithFeedback()` with image buffer

## How It Works Now

1. User provides feedback on location recognition
2. Image is converted from base64 to Buffer
3. Feedback is saved to database (location_feedback, TrainingQueue, NavisenseTraining)
4. Image + location data sent to Navisense ML API `/train` endpoint
5. ML API generates embedding and stores in Pinecone
6. Vector database grows with each verified location
7. Future predictions use similarity search against stored vectors

## Testing
To test the training:
1. Submit location feedback with an image
2. Check console logs for "✅ Navisense training successful"
3. Verify vector count increases in Pinecone
4. Check ML API health: `GET https://ssabiroad.onrender.com/health`

## Environment Variables Used
- `NAVISENSE_ML_URL` or `NEXT_PUBLIC_ML_API_URL`: ML API endpoint
- `PINECONE_API_KEY`: Pinecone authentication
- `PINECONE_INDEX_NAME`: Vector database index name
