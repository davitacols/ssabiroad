# Step-by-Step: Create EC2 Instance for Navisense ML

## Step 1: Login to AWS Console
1. Go to https://console.aws.amazon.com
2. Login with your AWS account
3. Make sure you're in **us-east-1** region (top right corner)

## Step 2: Navigate to EC2
1. Click "Services" (top left)
2. Search for "EC2"
3. Click "EC2" to open EC2 Dashboard

## Step 3: Launch Instance
1. Click orange "Launch instance" button
2. You'll see the instance creation form

## Step 4: Configure Instance

### Name and Tags
- **Name**: `navisense-ml`

### Application and OS Images (AMI)
- Click "Quick Start"
- Select **"Amazon Linux"**
- Choose **"Amazon Linux 2023 AMI"** (should be selected by default)
- Architecture: **64-bit (x86)**

### Instance Type
- Click dropdown
- Search for **"t3.small"**
- Select it (2 vCPU, 2 GiB Memory)
- Cost: ~$0.0208/hour = ~$15/month

### Key Pair (login)
**If you have a key pair:**
- Select your existing key pair

**If you DON'T have a key pair:**
1. Click "Create new key pair"
2. Key pair name: `navisense-ml-key`
3. Key pair type: **RSA**
4. Private key file format: **`.pem`** (for Mac/Linux) or **`.ppk`** (for Windows/PuTTY)
5. Click "Create key pair"
6. **IMPORTANT**: Save the downloaded file - you can't download it again!

### Network Settings
Click "Edit" button, then:

1. **VPC**: Keep default
2. **Subnet**: Keep default (or choose any)
3. **Auto-assign public IP**: **Enable**
4. **Firewall (security groups)**: Select "Create security group"
   - Security group name: `navisense-ml-sg`
   - Description: `Security group for Navisense ML service`
   
5. **Inbound Security Group Rules** - Add these rules:
   
   **Rule 1 (SSH):**
   - Type: SSH
   - Protocol: TCP
   - Port: 22
   - Source: My IP (or 0.0.0.0/0 for anywhere)
   
   **Rule 2 (ML API):**
   - Click "Add security group rule"
   - Type: Custom TCP
   - Protocol: TCP
   - Port: 8000
   - Source: 0.0.0.0/0 (Anywhere IPv4)
   - Description: ML API access

### Configure Storage
- **Size**: Change from 8 to **20 GiB**
- **Volume type**: gp3 (default)
- Keep other settings as default

### Advanced Details
- Leave everything as default (scroll down and ignore)

## Step 5: Review and Launch
1. On the right side, review the summary:
   - Instance type: t3.small
   - Storage: 20 GiB
   - Security groups: 2 rules (SSH + port 8000)

2. Click orange **"Launch instance"** button

3. You'll see "Successfully initiated launch of instance"

4. Click "View all instances"

## Step 6: Wait for Instance to Start
1. You'll see your instance in the list
2. Wait until:
   - **Instance state**: Running (green)
   - **Status check**: 2/2 checks passed (takes 2-3 minutes)

## Step 7: Get Connection Info
1. Select your instance (checkbox)
2. Look at the details below:
   - **Public IPv4 address**: Copy this (e.g., 3.85.123.45)
   - **Instance ID**: Note this for reference

## Step 8: Connect to Instance

### On Mac/Linux:
```bash
# Make key file secure
chmod 400 ~/Downloads/navisense-ml-key.pem

# Connect
ssh -i ~/Downloads/navisense-ml-key.pem ec2-user@YOUR_PUBLIC_IP
```

### On Windows (using PowerShell):
```powershell
# Connect
ssh -i C:\Users\YourName\Downloads\navisense-ml-key.pem ec2-user@YOUR_PUBLIC_IP
```

### On Windows (using PuTTY):
1. Open PuTTY
2. Host Name: `ec2-user@YOUR_PUBLIC_IP`
3. Connection → SSH → Auth → Browse for your .ppk file
4. Click "Open"

## Step 9: Deploy Application
Once connected, run:

```bash
# Download deployment script
curl -o deploy.sh https://raw.githubusercontent.com/davitacols/ssabiroad/master/navisense-ml/deploy-ec2-simple.sh

# Edit with your credentials
nano deploy.sh
# Replace YOUR_AWS_ACCESS_KEY_HERE with your actual AWS access key
# Replace YOUR_AWS_SECRET_KEY_HERE with your actual AWS secret key
# Replace YOUR_PINECONE_API_KEY_HERE with your actual Pinecone API key
# Replace YOUR_POSTGRES_PASSWORD_HERE with your actual Postgres password
# Press Ctrl+X, then Y, then Enter to save

# Make executable and run
chmod +x deploy.sh
./deploy.sh
```

Wait 3-5 minutes for Docker installation and model download.

## Step 10: Test Your Service
```bash
# Test health endpoint
curl http://YOUR_PUBLIC_IP:8000/health

# Should return: {"status":"healthy","model":"CLIP ViT-B/32",...}
```

## Step 11: Update Your Next.js App
In your `.env.local` or Vercel environment variables:
```
NEXT_PUBLIC_ML_API_URL=http://YOUR_PUBLIC_IP:8000
NAVISENSE_ML_URL=http://YOUR_PUBLIC_IP:8000
```

## Troubleshooting

**Can't connect via SSH:**
- Check security group allows port 22 from your IP
- Verify you're using correct key file
- Ensure instance is "Running"

**Port 8000 not accessible:**
- Check security group allows port 8000 from 0.0.0.0/0
- Run: `docker ps` to verify container is running
- Check logs: `docker logs navisense-ml`

**Out of memory:**
- Upgrade to t3.medium (4GB RAM): Stop instance → Actions → Instance settings → Change instance type

## Monthly Cost Estimate
- t3.small instance: $15.18
- 20GB storage: $2.00
- Data transfer: $1-3
- **Total: ~$18-20/month**

## Optional: Allocate Elastic IP (Static IP)
If you want a permanent IP that doesn't change:
1. EC2 Dashboard → Elastic IPs (left menu)
2. Click "Allocate Elastic IP address"
3. Click "Allocate"
4. Select the new IP → Actions → Associate Elastic IP address
5. Select your instance → Associate
6. Cost: Free while instance is running, $3.60/month if instance is stopped
