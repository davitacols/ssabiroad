# EC2 Deployment Guide

## Quick Deployment

### Option 1: Deploy from Local Machine (Windows)

1. **Edit configuration** in `deploy_local_to_ec2.bat`:
   ```batch
   set EC2_HOST=your-ec2-ip
   set EC2_USER=ubuntu
   set KEY_PATH=C:\path\to\your-key.pem
   ```

2. **Run deployment**:
   ```cmd
   deploy_local_to_ec2.bat
   ```

### Option 2: Deploy Directly on EC2

1. **SSH into EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Navigate to project**:
   ```bash
   cd /home/ubuntu/ssabiroad/ml-models
   ```

3. **Run deployment**:
   ```bash
   chmod +x deploy_to_ec2.sh
   ./deploy_to_ec2.sh
   ```

## First-Time Setup

If this is your first deployment:

1. **Clone repository on EC2**:
   ```bash
   cd /home/ubuntu
   git clone https://github.com/davitacols/ssabiroad.git
   cd ssabiroad/ml-models
   ```

2. **Run setup script**:
   ```bash
   chmod +x setup_ec2_service.sh
   ./setup_ec2_service.sh
   ```

3. **Configure environment**:
   ```bash
   cp config.example.json config.json
   nano config.json  # Edit with your settings
   ```

## Service Management

```bash
# Check status
sudo systemctl status ssabiroad-ml

# View logs
sudo journalctl -u ssabiroad-ml -f

# Restart service
sudo systemctl restart ssabiroad-ml

# Stop service
sudo systemctl stop ssabiroad-ml

# Start service
sudo systemctl start ssabiroad-ml
```

## Security Group Configuration

Ensure your EC2 security group allows:
- **Port 8000**: ML API access
- **Port 22**: SSH access (your IP only)

## Environment Variables

Create `/home/ubuntu/ssabiroad/ml-models/.env`:
```env
DEVICE=cpu
SIMILARITY_THRESHOLD=0.75
LOG_LEVEL=INFO
```

## Monitoring

Access API documentation:
```
http://your-ec2-ip:8000/docs
```

Check system health:
```
http://your-ec2-ip:8000/health
```

View model stats:
```
http://your-ec2-ip:8000/stats
```

## Troubleshooting

### Service won't start
```bash
# Check logs
sudo journalctl -u ssabiroad-ml -n 50

# Check Python environment
cd /home/ubuntu/ssabiroad/ml-models
source venv/bin/activate
python -c "import torch; print(torch.__version__)"
```

### Port already in use
```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>
```

### Out of memory
```bash
# Check memory usage
free -h

# Restart service
sudo systemctl restart ssabiroad-ml
```

## Performance Optimization

For production:
1. Use GPU instance (g4dn.xlarge or better)
2. Enable swap if needed:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```
3. Configure nginx as reverse proxy
4. Set up SSL with Let's Encrypt

## Backup

Backup trained models:
```bash
cd /home/ubuntu/ssabiroad/ml-models
tar -czf models-backup-$(date +%Y%m%d).tar.gz models/ faiss_index/
```

## Updates

To update after code changes:
```bash
cd /home/ubuntu/ssabiroad/ml-models
git pull
./deploy_to_ec2.sh
```
