# Navisense ML - Render Deployment Guide

## Quick Deploy to Render

### 1. Push to GitHub
```bash
cd d:\ssabiroad
git add navisense-ml/
git commit -m "Add Navisense ML service"
git push origin main
```

### 2. Deploy on Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository
5. Configure:
   - **Name**: navisense-ml
   - **Region**: Oregon (or closest to your users)
   - **Branch**: main
   - **Root Directory**: navisense-ml
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Plan**: Starter ($7/month) or Free

### 3. Set Environment Variables

In Render dashboard, add these environment variables:

```
DATABASE_URL=<your_database_url>
PINECONE_API_KEY=<your_pinecone_key>
PINECONE_INDEX_NAME=navisense-locations
AWS_ACCESS_KEY_ID=<your_aws_key>
AWS_SECRET_ACCESS_KEY=<your_aws_secret>
AWS_S3_REGION_NAME=us-east-1
AWS_S3_BUCKET_NAME=pic2nav-blog-2025
```

**Get values from your local `.env` file**

### 4. Deploy

Click "Create Web Service" - Render will:
- Clone your repository
- Install dependencies
- Start the service
- Provide a URL like: `https://navisense-ml.onrender.com`

### 5. Update Frontend

Update `.env.local`:
```bash
NEXT_PUBLIC_ML_API_URL=https://navisense-ml.onrender.com
```

### 6. Test Deployment

```bash
curl https://navisense-ml.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "model": "CLIP ViT-B/32",
  "device": "cpu",
  "vectors_in_db": 2
}
```

## Monitoring

- **Logs**: Render Dashboard → Logs tab
- **Metrics**: Render Dashboard → Metrics tab
- **Health**: Check `/health` endpoint

## Troubleshooting

### Service Won't Start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure requirements.txt is correct

### Database Connection Error
- Verify DATABASE_URL includes `?sslmode=require`
- Check RDS security group allows Render IPs

### Out of Memory
- Upgrade to higher plan
- CLIP model needs ~1GB RAM minimum

## Cost Estimate

- **Free Tier**: Limited hours, sleeps after inactivity
- **Starter ($7/mo)**: Always on, 512MB RAM
- **Standard ($25/mo)**: 2GB RAM (recommended for production)

## Auto-Deploy

Render automatically deploys when you push to GitHub:
```bash
git add .
git commit -m "Update ML service"
git push
```

Render will detect changes and redeploy automatically.
