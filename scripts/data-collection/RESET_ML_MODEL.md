# Reset ML Model - Fresh Training

## Problem
ML model is returning the same address for all predictions:
- **305 Walworth Rd, London SE17 2TG, UK**

This indicates the model was trained on bad data (1,146 items with "No address").

## Solution: Clear and Retrain

### Step 1: SSH into EC2 Server
```bash
ssh -i your-key.pem ubuntu@34.224.33.158
```

### Step 2: Clear Training Data
```bash
# Navigate to ML API directory
cd /path/to/ml-api

# Clear the training queue
curl -X POST http://localhost:8000/clear_queue

# OR manually delete training data files
rm -rf data/training_queue/*
rm -rf data/trained_model/*
rm -rf data/embeddings/*

# Restart the ML service
sudo systemctl restart ml-api
# OR
pm2 restart ml-api
```

### Step 3: Verify Queue is Empty
```bash
curl http://34.224.33.158:8000/training_queue
```

Should return empty array: `[]`

### Step 4: Train with Fresh Data (from local machine)
```bash
# On your Windows machine (D:\ssabiroad)
node scripts/data-collection/enrich-addresses.js
node scripts/data-collection/train-collected.js
```

This will send 215 images with proper addresses like:
- "230 Broadway, New York, NY 10007, USA"
- "Tower Bridge Rd, London SE1 2UP, UK"
- "5 Avenue Anatole France, 75007 Paris, France"

### Step 5: Trigger Model Retraining
```bash
curl -X POST http://34.224.33.158:8000/retrain
```

## Alternative: If No SSH Access

Contact the server administrator and ask them to:
1. Clear the training queue: `DELETE /training_queue` or manual file deletion
2. Reset the model: `DELETE /model` or remove model files
3. Restart the ML service

Then you can upload fresh training data from your local machine.

## Verification

After retraining, test with the camera:
1. Take a photo of a known location
2. Check if it returns the correct address (not "305 Walworth Rd")
3. Monitor the ML training dashboard at `/ml-training`
