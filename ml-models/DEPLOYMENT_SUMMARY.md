# EC2 Deployment - Quick Start

## 🚀 Deploy in 3 Steps

### Step 1: Configure (Windows)
Edit `deploy_local_to_ec2.bat`:
```batch
set EC2_HOST=your-ec2-ip
set EC2_USER=ubuntu
set KEY_PATH=C:\path\to\key.pem
```

### Step 2: Deploy
```cmd
deploy_local_to_ec2.bat
```

### Step 3: Verify
Open: `http://your-ec2-ip:8000/docs`

## 📁 Deployment Files Created

| File | Purpose |
|------|---------|
| `deploy_local_to_ec2.bat` | Deploy from Windows to EC2 |
| `deploy_to_ec2.sh` | Redeploy on EC2 (updates) |
| `setup_ec2_service.sh` | First-time EC2 setup |
| `check_ec2_health.sh` | Health check script |
| `.env.example` | Environment configuration |
| `DEPLOYMENT.md` | Full deployment guide |
| `EC2_DEPLOYMENT_CHECKLIST.md` | Step-by-step checklist |

## 🔧 First-Time Setup

If deploying for the first time:

1. **SSH to EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Clone & Setup**:
   ```bash
   cd /home/ubuntu
   git clone https://github.com/davitacols/ssabiroad.git
   cd ssabiroad/ml-models
   chmod +x setup_ec2_service.sh
   ./setup_ec2_service.sh
   ```

3. **Configure**:
   ```bash
   cp .env.example .env
   nano .env  # Edit settings
   ```

## 🔄 Update Existing Deployment

### Option A: From Windows
```cmd
deploy_local_to_ec2.bat
```

### Option B: On EC2
```bash
cd /home/ubuntu/ssabiroad/ml-models
git pull
./deploy_to_ec2.sh
```

## ✅ Verify Deployment

```bash
# Check service
sudo systemctl status ssabiroad-ml

# View logs
sudo journalctl -u ssabiroad-ml -f

# Test API
curl http://localhost:8000/
curl http://localhost:8000/stats
```

## 🌐 Access Points

- **API Docs**: `http://your-ec2-ip:8000/docs`
- **Health**: `http://your-ec2-ip:8000/`
- **Stats**: `http://your-ec2-ip:8000/stats`
- **Models**: `http://your-ec2-ip:8000/models`

## 🛡️ Security Group

Ensure EC2 security group allows:
- **Port 8000**: Inbound from 0.0.0.0/0 (or your IP)
- **Port 22**: Inbound from your IP only

## 📊 Monitor Performance

```bash
# Service status
sudo systemctl status ssabiroad-ml

# Live logs
sudo journalctl -u ssabiroad-ml -f

# System resources
htop

# API stats
curl http://localhost:8000/stats | python3 -m json.tool
```

## 🐛 Quick Troubleshooting

### Service not starting?
```bash
sudo journalctl -u ssabiroad-ml -n 50
```

### Port in use?
```bash
sudo lsof -i :8000
sudo kill -9 <PID>
sudo systemctl restart ssabiroad-ml
```

### Dependencies issue?
```bash
cd /home/ubuntu/ssabiroad/ml-models
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart ssabiroad-ml
```

## 📞 Support

Check full documentation:
- `DEPLOYMENT.md` - Complete guide
- `EC2_DEPLOYMENT_CHECKLIST.md` - Detailed checklist
- `TRAINING_GUIDE.md` - Model training
- `ARCHITECTURE.md` - System architecture
