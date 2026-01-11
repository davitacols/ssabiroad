# Navisense ML Service

User-feedback powered location recognition using CLIP embeddings and Pinecone vector search.

## Architecture

- **Model**: OpenAI CLIP (ViT-B/32) for image embeddings
- **Vector DB**: Pinecone for similarity search
- **Framework**: FastAPI for REST API
- **Database**: PostgreSQL for training data

## Setup

### 1. Install Dependencies

```bash
cd navisense-ml
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file with:
```
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=navisense-locations
DATABASE_URL=your_postgres_url
```

### 3. Run Locally

```bash
python app.py
```

API will be available at `http://localhost:8000`

## API Endpoints

### GET /health
Check service health and stats

### POST /predict
Predict location from image
- Input: Image file (multipart/form-data)
- Output: Location prediction with confidence

### POST /sync-training
Sync verified feedback from database to Pinecone

### GET /stats
Get training statistics

## Docker Deployment

### Build Image
```bash
docker build -t navisense-ml .
```

### Run Container
```bash
docker run -p 8000:8000 --env-file .env navisense-ml
```

## AWS Lambda Deployment (Coming Soon)

For serverless deployment with lower costs.

## Training Pipeline

1. Users submit feedback (correct/incorrect)
2. Verified locations stored in PostgreSQL
3. Cron job runs `/sync-training` weekly
4. CLIP embeddings generated and stored in Pinecone
5. New predictions use similarity search

## Current Status

- ✅ CLIP model integration
- ✅ Pinecone vector database
- ✅ Prediction endpoint
- ✅ Database sync endpoint
- ⏳ Image storage integration (S3)
- ⏳ Automated training pipeline
- ⏳ AWS Lambda deployment
