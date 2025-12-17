# 🚀 Deploy to EC2 - Start Here

Your PEM key is configured: `C:\Users\USER\Downloads\pic2nav-ml-key.pem`

## Step 1: Get Your EC2 IP Address

### Option A: AWS Console
1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click "Instances"
3. Find your instance (should be named something like "pic2nav-ml" or "ssabiroad-ml")
4. Copy the "Public IPv4 address" (e.g., 54.123.45.67)

### Option B: AWS CLI
```cmd
aws ec2 describe-instances --query "Reservations[*].Instances[*].[Tags[?Key=='Name'].Value|[0],PublicIpAddress,State.Name]" --output table
```

## Step 2: Test Connection

```cmd
test_ec2_connection.bat YOUR-EC2-IP
```

Example:
```cmd
test_ec2_connection.bat 54.123.45.67
```

## Step 3: Update Deployment Script

Edit `deploy_local_to_ec2.bat` line 5:
```batch
set EC2_HOST=54.123.45.67  # Replace with your actual IP
```

## Step 4: Deploy

```cmd
deploy_local_to_ec2.bat
```

## Step 5: Verify

Open in browser:
- API Docs: `http://YOUR-EC2-IP:8000/docs`
- Health: `http://YOUR-EC2-IP:8000/`
- Stats: `http://YOUR-EC2-IP:8000/stats`

---

## 🔧 First-Time EC2 Setup

If you haven't set up the EC2 instance yet:

1. **SSH to EC2**:
   ```cmd
   ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@YOUR-EC2-IP
   ```

2. **Clone repository**:
   ```bash
   cd /home/ubuntu
   git clone https://github.com/davitacols/ssabiroad.git
   cd ssabiroad/ml-models
   ```

3. **Run setup**:
   ```bash
   chmod +x setup_ec2_service.sh
   ./setup_ec2_service.sh
   ```

4. **Exit SSH and deploy from Windows**:
   ```cmd
   deploy_local_to_ec2.bat
   ```

---

## 🛡️ Security Group Check

Ensure your EC2 security group allows:
- **Port 22** (SSH): Your IP only
- **Port 8000** (API): 0.0.0.0/0 or your IP

To check/update:
1. Go to EC2 Console
2. Select your instance
3. Click "Security" tab
4. Click security group link
5. Edit "Inbound rules"

---

## 📞 Need Help?

Run these helper scripts:
- `get_ec2_ip.bat` - Guide to find EC2 IP
- `test_ec2_connection.bat YOUR-IP` - Test SSH connection

Read documentation:
- `DEPLOYMENT_SUMMARY.md` - Quick reference
- `DEPLOYMENT.md` - Full guide
- `EC2_DEPLOYMENT_CHECKLIST.md` - Step-by-step
