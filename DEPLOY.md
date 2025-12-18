# ML Model Deployment Guide

## Quick Deploy

### Option 1: Using Script (Recommended)

**Windows:**
```powershell
.\deploy-ml.ps1 -KeyPath "C:\path\to\your-key.pem"
```

**Linux/Mac:**
```bash
chmod +x deploy-ml.sh
./deploy-ml.sh /path/to/your-key.pem
```

### Option 2: Manual Deploy

1. **Copy updated file to EC2:**
```bash
scp -i your-key.pem ml-models/api/main.py ec2-user@34.224.33.158:~/ml-models/api/
```

2. **SSH into EC2:**
```bash
ssh -i your-key.pem ec2-user@34.224.33.158
```

3. **Restart ML server:**
```bash
cd ~/ml-models/api

# If using PM2:
pm2 restart navisense

# Or manually:
pkill -f "python.*main.py"
nohup python3 main.py > ml-server.log 2>&1 &
```

4. **Verify deployment:**
```bash
curl http://34.224.33.158:8000/
```

## What Gets Deployed

- ✅ Updated `/train` endpoint
- ✅ Fixed `activate_model` function
- ✅ All bug fixes

## After Deployment

Test the `/train` endpoint:
```bash
curl -X POST http://34.224.33.158:8000/train \
  -F "file=@test-image.jpg" \
  -F "latitude=51.5074" \
  -F "longitude=-0.1278" \
  -F 'metadata={"method":"test"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Training data added to queue",
  "queue_size": 1,
  "should_retrain": false
}
```

## Troubleshooting

**Server not responding:**
```bash
ssh -i your-key.pem ec2-user@34.224.33.158
cd ~/ml-models/api
tail -f ml-server.log
```

**Port 8000 blocked:**
- Check EC2 Security Group allows inbound on port 8000
- AWS Console → EC2 → Security Groups → Add rule: Custom TCP, Port 8000, Source: 0.0.0.0/0

**Dependencies missing:**
```bash
pip3 install -r requirements.txt
```
