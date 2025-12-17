# EC2 Deployment Checklist

## Pre-Deployment

- [ ] EC2 instance running (recommended: t3.medium or better)
- [ ] Security group allows port 8000 and 22
- [ ] SSH key (.pem file) available
- [ ] Git repository accessible from EC2
- [ ] Code committed and pushed to main branch

## First-Time Setup (Run Once)

1. **SSH into EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Clone repository**:
   ```bash
   cd /home/ubuntu
   git clone https://github.com/davitacols/ssabiroad.git
   cd ssabiroad/ml-models
   ```

3. **Run setup script**:
   ```bash
   chmod +x setup_ec2_service.sh
   ./setup_ec2_service.sh
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   nano .env  # Edit as needed
   ```

5. **Verify setup**:
   ```bash
   sudo systemctl status ssabiroad-ml
   ```

## Redeployment (Updates)

### From Windows:

1. **Edit `deploy_local_to_ec2.bat`** with your EC2 details
2. **Run**: `deploy_local_to_ec2.bat`

### From EC2:

1. **SSH into EC2**
2. **Run**: `cd /home/ubuntu/ssabiroad/ml-models && ./deploy_to_ec2.sh`

## Post-Deployment Verification

- [ ] Service is running: `sudo systemctl status ssabiroad-ml`
- [ ] API responds: `curl http://localhost:8000/`
- [ ] Health check passes: `./check_ec2_health.sh localhost`
- [ ] Logs are clean: `sudo journalctl -u ssabiroad-ml -n 50`
- [ ] External access works: `http://your-ec2-ip:8000/docs`

## Quick Commands

```bash
# Check service status
sudo systemctl status ssabiroad-ml

# View live logs
sudo journalctl -u ssabiroad-ml -f

# Restart service
sudo systemctl restart ssabiroad-ml

# Check API health
curl http://localhost:8000/stats

# View recent errors
sudo journalctl -u ssabiroad-ml -p err -n 20
```

## Troubleshooting

### Service won't start
```bash
# Check detailed logs
sudo journalctl -u ssabiroad-ml -n 100 --no-pager

# Test manually
cd /home/ubuntu/ssabiroad/ml-models
source venv/bin/activate
python api/main.py
```

### Port 8000 in use
```bash
sudo lsof -i :8000
sudo kill -9 <PID>
sudo systemctl restart ssabiroad-ml
```

### Dependencies missing
```bash
cd /home/ubuntu/ssabiroad/ml-models
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart ssabiroad-ml
```

## Performance Monitoring

```bash
# CPU/Memory usage
htop

# Disk space
df -h

# Service resource usage
systemctl status ssabiroad-ml
```

## Backup Before Major Updates

```bash
cd /home/ubuntu/ssabiroad/ml-models
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz models/ faiss_index/ data/
```
