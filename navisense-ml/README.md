# Navisense ML Service

Location recognition ML service using CLIP embeddings and Pinecone vector database.

## Setup

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env` (already done)
   - Ensure all credentials are set:
     - `DATABASE_URL` - PostgreSQL connection
     - `PINECONE_API_KEY` - Pinecone API key
     - `AWS_ACCESS_KEY_ID` - AWS S3 access
     - `AWS_SECRET_ACCESS_KEY` - AWS S3 secret

3. **Start the service**
   ```bash
   python app.py
   ```
   Service runs on http://localhost:8000

## API Endpoints

### GET /health
Check service health and vector count
```bash
curl http://localhost:8000/health
```

### GET /stats
Get training statistics
```bash
curl http://localhost:8000/stats
```

### POST /predict
Predict location from image
```bash
curl -X POST -F "file=@image.jpg" http://localhost:8000/predict
```

### POST /train
Add single training sample
```bash
curl -X POST -F "file=@image.jpg" http://localhost:8000/train
```

### POST /sync-training
Sync verified locations from database (downloads images, generates embeddings, stores in Pinecone)
```bash
curl -X POST http://localhost:8000/sync-training
```

## Training Pipeline

1. **User uploads image** → Location recognition API
2. **System detects location** → Stores in `location_recognitions` table
3. **User provides feedback** → Stores in `location_feedback` table
4. **Cron job or manual trigger** → Calls `/sync-training`
5. **Service processes**:
   - Downloads images from S3
   - Generates CLIP embeddings
   - Stores in Pinecone with metadata
6. **Model improves** → Better predictions for similar locations

## Testing

Run the complete pipeline test:
```bash
cd d:\ssabiroad
node scripts\test-ml-pipeline.js
```

## Architecture

- **Model**: CLIP ViT-B/32 (512-dimensional embeddings)
- **Vector DB**: Pinecone (cosine similarity search)
- **Storage**: AWS S3 (images)
- **Database**: PostgreSQL (metadata, feedback)
- **Framework**: FastAPI + PyTorch

## Troubleshooting

### SSL Certificate Error
The service automatically downloads AWS RDS CA certificate on first run.

### S3 Access Error
Verify AWS credentials in `.env` file and S3 bucket permissions.

### Out of Memory
CLIP model requires ~1GB RAM. Consider using CPU mode or smaller batch sizes.

### Pinecone Connection
Check API key and ensure index `navisense-locations` exists.
