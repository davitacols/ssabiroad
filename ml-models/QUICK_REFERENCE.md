# ML API Quick Reference Card

## 🚀 Deploy
```bash
cd d:\ssabiroad\ml-models
DEPLOY_FIX_NOW.bat
```

## 🧪 Test
```bash
# Health
curl http://34.224.33.158:8000/health

# Queue
curl http://34.224.33.158:8000/training_queue

# Train
curl -X POST http://34.224.33.158:8000/trigger_training

# Full test
node test-fixed-api.js
```

## 📊 Check Status
```bash
ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158

# Service
sudo systemctl status ssabiroad-ml

# Logs
sudo journalctl -u ssabiroad-ml -f

# Queue
cat /home/ubuntu/ssabiroad/ml-models/data/active_learning/training_queue.json
```

## 🔄 Restart Service
```bash
ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158
sudo systemctl restart ssabiroad-ml
```

## 🔙 Rollback
```bash
ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158
cd /home/ubuntu/ssabiroad/ml-models
cp api/main_backup.py api/main.py
sudo systemctl restart ssabiroad-ml
```

## 📝 Useful Commands
```bash
# Check disk space
df -h

# Check memory
free -h

# Check Python packages
pip list | grep -E "fastapi|torch|PIL"

# Test manually
cd /home/ubuntu/ssabiroad/ml-models
python3 api/main.py

# View queue size
curl -s http://34.224.33.158:8000/stats | grep -o '"queue_size":[0-9]*'
```

## 🌐 API Endpoints
- Health: `GET /health`
- Queue: `GET /training_queue`
- Stats: `GET /stats`
- Train: `POST /train` (with file + metadata)
- Feedback: `POST /feedback` (with file + location)
- Trigger Training: `POST /trigger_training`
- Retrain: `POST /retrain`

## 📞 EC2 Info
- IP: 34.224.33.158
- User: ubuntu
- Key: C:\Users\USER\Downloads\pic2nav-ml-key.pem
- Service: ssabiroad-ml
- Port: 8000
- Docs: http://34.224.33.158:8000/docs
