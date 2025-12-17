# 🚀 One-Command EC2 Deployment

## Fastest Way to Deploy

```cmd
DEPLOY_NOW.bat YOUR-EC2-IP
```

Example:
```cmd
DEPLOY_NOW.bat 54.123.45.67
```

That's it! ✅

---

## What You Need

1. ✅ **PEM Key**: Already configured at `C:\Users\USER\Downloads\pic2nav-ml-key.pem`
2. ❓ **EC2 IP**: Get from [AWS Console](https://console.aws.amazon.com/ec2/)

---

## Quick Steps

### 1. Get EC2 IP
- Open [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
- Click "Instances"
- Copy "Public IPv4 address"

### 2. Deploy
```cmd
DEPLOY_NOW.bat 54.123.45.67
```
(Replace with your actual IP)

### 3. Access
- **API Docs**: http://YOUR-IP:8000/docs
- **Health**: http://YOUR-IP:8000/
- **Stats**: http://YOUR-IP:8000/stats

---

## Helper Scripts

| Script | Purpose |
|--------|---------|
| `DEPLOY_NOW.bat YOUR-IP` | **One-command deploy** |
| `test_ec2_connection.bat YOUR-IP` | Test SSH connection |
| `get_ec2_ip.bat` | Guide to find EC2 IP |
| `deploy_local_to_ec2.bat` | Manual deployment |

---

## First-Time Setup?

If EC2 instance is brand new:

1. **SSH to EC2**:
   ```cmd
   ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@YOUR-IP
   ```

2. **Setup**:
   ```bash
   cd /home/ubuntu
   git clone https://github.com/davitacols/ssabiroad.git
   cd ssabiroad/ml-models
   chmod +x setup_ec2_service.sh
   ./setup_ec2_service.sh
   ```

3. **Deploy from Windows**:
   ```cmd
   DEPLOY_NOW.bat YOUR-IP
   ```

---

## Security Group

Ensure these ports are open:
- **Port 22**: SSH (your IP only)
- **Port 8000**: API (0.0.0.0/0 or your IP)

---

## Troubleshooting

### Can't connect?
```cmd
test_ec2_connection.bat YOUR-IP
```

### Deployment failed?
```cmd
ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@YOUR-IP
sudo journalctl -u ssabiroad-ml -n 50
```

### Need detailed guide?
Read `START_HERE.md`

---

## Full Documentation

- `START_HERE.md` - Complete setup guide
- `DEPLOYMENT_SUMMARY.md` - Quick reference
- `DEPLOYMENT.md` - Detailed documentation
- `EC2_DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
