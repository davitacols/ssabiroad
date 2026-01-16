# EC2 Deployment Guide - Navisense ML

## Quick Start (5 minutes)

### 1. Launch EC2 Instance

**AWS Console:**
- Go to EC2 → Launch Instance
- **Name**: navisense-ml
- **AMI**: Amazon Linux 2023
- **Instance type**: t3.small (2GB RAM, 2 vCPU) - $15/month
- **Key pair**: Create or select existing
- **Security Group**: Allow ports 22 (SSH) and 8000 (HTTP)
- **Storage**: 20GB gp3
- Click "Launch Instance"

### 2. Connect to EC2

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### 3. Deploy

```bash
curl -o deploy.sh https://raw.githubusercontent.com/davitacols/ssabiroad/master/navisense-ml/deploy-ec2-simple.sh
chmod +x deploy.sh
./deploy.sh
```

Wait 2-3 minutes for model download and container start.

### 4. Test

```bash
# Check health
curl http://YOUR_EC2_PUBLIC_IP:8000/health

# Check stats
curl http://YOUR_EC2_PUBLIC_IP:8000/stats
```

### 5. Update Frontend

Update your Next.js app to use new ML API URL:

```env
NEXT_PUBLIC_ML_API_URL=http://YOUR_EC2_PUBLIC_IP:8000
NAVISENSE_ML_URL=http://YOUR_EC2_PUBLIC_IP:8000
```

## Cost Breakdown

- **t3.small EC2**: $15/month
- **20GB Storage**: $2/month
- **Data Transfer**: $1-3/month
- **Total**: ~$18-20/month

## Monitoring

```bash
# View logs
docker logs -f navisense-ml

# Check container status
docker ps

# Restart service
docker restart navisense-ml
```

## Updates

```bash
cd ssabiroad/navisense-ml
git pull
./deploy-ec2-simple.sh
```

## Troubleshooting

**Container won't start:**
```bash
docker logs navisense-ml
```

**Out of memory:**
```bash
# Upgrade to t3.medium (4GB RAM)
```

**Port not accessible:**
- Check Security Group allows port 8000
- Check EC2 firewall: `sudo iptables -L`

## Production Setup (Optional)

For production, add:
- **Elastic IP** (static IP): $3.60/month
- **Application Load Balancer**: $16/month
- **HTTPS with ACM certificate**: Free
- **CloudWatch monitoring**: $1-2/month

Total production cost: ~$40-45/month
