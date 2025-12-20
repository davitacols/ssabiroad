# ML Training System

Complete implementation of automated ML model training with monitoring dashboard.

## ✅ EC2 Deployment Complete

The EC2 ML server has been updated with:
- `/training_queue` endpoint - Returns queue status
- `/training_status` endpoint - Returns training progress
- `json` import added to main.py
- Service restarted and verified working

## Features

### 1. API Endpoints

- **`/api/ml/training-queue`** - GET training queue status
- **`/api/ml/training-status`** - GET current training status
- **`/api/ml/train`** - POST to trigger manual training
- **`/api/ml-stats`** - GET model statistics
- **`/api/cron/ml-training`** - POST automated training (cron job)

### 2. Dashboard

Access at `/ml-training` to:
- View training queue (items waiting)
- Monitor training status (idle/training)
- Check model statistics (buildings, vectors)
- Manually trigger training
- Auto-refresh every 30 seconds

### 3. Automated Training

Cron job runs every 6 hours:
- Checks training queue
- Triggers training if items exist
- Runs at: 00:00, 06:00, 12:00, 18:00 UTC

### 4. Monitoring Component

Add to admin dashboard:
```tsx
import { MLTrainingMonitor } from '@/components/ml-training-monitor';

<MLTrainingMonitor />
```

## Usage

### Manual Training
```bash
curl -X POST https://ssabiroad.vercel.app/api/ml/train
```

### Check Queue
```bash
curl https://ssabiroad.vercel.app/api/ml/training-queue
```

### Trigger Cron (requires secret)
```bash
curl -X POST https://ssabiroad.vercel.app/api/cron/ml-training \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Configuration

Environment variables required:
- `ML_API_URL` - ML server URL (default: http://34.224.33.158:8000)
- `CRON_SECRET` - Secret for cron authentication

## Deployment

1. Push to Vercel
2. Cron jobs auto-configured via `vercel.json`
3. Access dashboard at `/ml-training`

## Monitoring

Dashboard shows:
- Queue size and items
- Training status and progress
- Model statistics
- Last training timestamp
- Priority levels (high/normal)
- Correction flags
