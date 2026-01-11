# Navisense ML Deployment Guide

## Option 1: AWS EC2 (Recommended - Simple & Fast)

### Step 1: Launch EC2 Instance
```bash
# Instance type: t3.medium (2 vCPU, 4GB RAM)
# AMI: Ubuntu 22.04 LTS
# Storage: 20GB
# Security Group: Allow port 8000
```

### Step 2: Upload Files
```bash
# From your local machine
scp -r navisense-ml ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

### Step 3: Run Deployment Script
```bash
ssh ubuntu@YOUR_EC2_IP
cd /home/ubuntu/navisense-ml
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### Step 4: Update Environment Variables
```bash
# On EC2 instance
nano /home/ubuntu/navisense-ml/.env

# Add:
PINECONE_API_KEY=pcsk_2rejZC_Ke2doiJBSiAS13Vkq5GXPPTGT3MLEJUhM2C7rP18KBFXT5MDueh4sge8cstAZPe
PINECONE_INDEX_NAME=navisense-locations
DATABASE_URL=postgresql://ssabiroad_admin:SSABIRoad2026Secure@ssabiroad-db.ca968o2wg9ep.us-east-1.rds.amazonaws.com:5432/ssabiroad?sslmode=require

# Restart service
sudo systemctl restart navisense-ml
```

### Step 5: Test
```bash
curl http://YOUR_EC2_IP:8000/health
```

### Step 6: Update Next.js App
In `.env.local`:
```env
NAVISENSE_ML_URL=http://YOUR_EC2_IP:8000
```

---

## Option 2: Railway (Easiest - No Server Management)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Step 2: Deploy
```bash
cd navisense-ml
railway init
railway up
```

### Step 3: Add Environment Variables
```bash
railway variables set PINECONE_API_KEY=pcsk_2rejZC_Ke2doiJBSiAS13Vkq5GXPPTGT3MLEJUhM2C7rP18KBFXT5MDueh4sge8cstAZPe
railway variables set PINECONE_INDEX_NAME=navisense-locations
railway variables set DATABASE_URL=postgresql://ssabiroad_admin:SSABIRoad2026Secure@ssabiroad-db.ca968o2wg9ep.us-east-1.rds.amazonaws.com:5432/ssabiroad?sslmode=require
```

### Step 4: Get URL
```bash
railway domain
# Copy the URL (e.g., https://navisense-ml-production.up.railway.app)
```

---

## Option 3: Render (Free Tier Available)

### Step 1: Create render.yaml
Already created in navisense-ml folder

### Step 2: Push to GitHub
```bash
git add navisense-ml
git commit -m "Add Navisense ML service"
git push
```

### Step 3: Deploy on Render
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Select `navisense-ml` folder
5. Add environment variables
6. Deploy

---

## Quick Start (Use Existing EC2)

If you already have an EC2 instance running:

```bash
# SSH to your instance
ssh ubuntu@YOUR_EC2_IP

# Install dependencies
sudo apt-get update
sudo apt-get install -y python3-pip
pip3 install fastapi uvicorn torch transformers pinecone psycopg2-binary python-dotenv pillow "numpy==1.24.3"

# Upload files
# (Use scp from local machine)

# Run service
cd navisense-ml
nohup python3 app.py > ml.log 2>&1 &

# Check logs
tail -f ml.log
```

---

## Cost Comparison

| Option | Cost | Setup Time | Scalability |
|--------|------|------------|-------------|
| EC2 t3.medium | ~$30/month | 10 min | Manual |
| Railway | $5/month | 5 min | Auto |
| Render | Free tier | 5 min | Auto |

---

## Recommended: Railway

Fastest and easiest deployment:

```bash
cd navisense-ml
npm install -g @railway/cli
railway login
railway init
railway up
railway variables set PINECONE_API_KEY=pcsk_2rejZC_Ke2doiJBSiAS13Vkq5GXPPTGT3MLEJUhM2C7rP18KBFXT5MDueh4sge8cstAZPe
railway domain
```

Copy the URL and update `.env.local`:
```env
NAVISENSE_ML_URL=https://your-app.up.railway.app
```

Done! 🚀
