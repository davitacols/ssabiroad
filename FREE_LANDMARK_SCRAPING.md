# FREE Landmark Scraping - No Premium Required

## 100% Free Sources (No Premium Needed)

### 1. Wikimedia Commons ⭐ BEST
- **Cost**: FREE forever
- **API Key**: Not required
- **Images**: 80M+ media files
- **Landmarks**: Excellent coverage
- **GPS Data**: Yes, many images
- **License**: Public Domain, CC-BY, CC-BY-SA
- **Commercial Use**: ✅ Yes

### 2. Pexels ⭐ RECOMMENDED
- **Cost**: FREE forever
- **API Key**: FREE (no credit card)
- **Images**: 3M+ high-quality photos
- **Landmarks**: Good coverage
- **GPS Data**: Some images
- **License**: Pexels License (free commercial use)
- **Commercial Use**: ✅ Yes
- **Get Key**: https://www.pexels.com/api/ (instant approval)

### 3. Unsplash
- **Cost**: FREE forever
- **API Key**: FREE (no credit card)
- **Images**: 3M+ high-quality photos
- **Landmarks**: Good coverage
- **GPS Data**: Some images
- **License**: Unsplash License (free commercial use)
- **Commercial Use**: ✅ Yes
- **Get Key**: https://unsplash.com/developers (instant approval)

### 4. Google Landmarks Dataset v2 ⭐ HUGE
- **Cost**: FREE forever
- **API Key**: Not required
- **Images**: 5M+ images, 200K+ landmarks
- **Landmarks**: Comprehensive global coverage
- **GPS Data**: All images have coordinates
- **License**: CC-BY 2.0
- **Commercial Use**: ✅ Yes
- **Download**: Direct from S3 bucket

## Quick Start (5 Minutes)

### Step 1: Get FREE API Keys

**Pexels** (30 seconds):
1. Go to https://www.pexels.com/api/
2. Click "Get Started"
3. Enter email, create account
4. Copy API key (instant)

**Unsplash** (30 seconds):
1. Go to https://unsplash.com/developers
2. Click "Register as a developer"
3. Create new application
4. Copy Access Key (instant)

### Step 2: Set Environment Variables
```bash
# Windows
set PEXELS_API_KEY=your_key_here
set UNSPLASH_ACCESS_KEY=your_key_here

# Mac/Linux
export PEXELS_API_KEY=your_key_here
export UNSPLASH_ACCESS_KEY=your_key_here
```

### Step 3: Run Scraper
```bash
cd d:\ssabiroad
python scripts/scrape_landmarks.py
```

## Expected Results (Per Landmark)

| Source | Images | GPS Data | Quality |
|--------|--------|----------|---------|
| Wikimedia Commons | 20-50 | 60% | High |
| Pexels | 10-30 | 30% | Very High |
| Unsplash | 10-20 | 40% | Very High |
| **TOTAL** | **40-100** | **50%** | **High** |

## For 1,000 Landmarks

- **Total Images**: 40,000-100,000
- **With GPS**: 20,000-50,000
- **Time to Scrape**: 8-15 hours
- **Storage**: 40-80 GB
- **Cost**: $0

## Alternative: Google Landmarks Dataset v2

### Why Use This?
- **5 MILLION images** already collected
- **200,000 landmarks** worldwide
- **100% GPS tagged**
- **FREE download**
- **No API keys needed**

### Quick Download
```bash
# Install dependencies
pip install pandas requests

# Download metadata (small file)
wget https://s3.amazonaws.com/google-landmark/metadata/train.csv

# Process and download images
python scripts/download_google_landmarks.py
```

### Dataset Structure
```csv
id,landmark_id,url,latitude,longitude
abc123,5376,https://...,48.8584,2.2945
```

## Recommended Strategy

### Option A: Quick Start (1 Week)
1. Use Google Landmarks Dataset v2
2. Download 10,000 images for top 1,000 landmarks
3. Start training model immediately
4. **Result**: Working model in 1 week

### Option B: High Quality (1 Month)
1. Scrape Wikimedia + Pexels + Unsplash
2. Collect 50,000 curated images
3. Manual quality review
4. **Result**: Premium dataset in 1 month

### Option C: Hybrid (Best) ⭐
1. Download Google Landmarks Dataset (5M images)
2. Supplement with Wikimedia/Pexels for quality
3. Filter and curate best 50,000 images
4. **Result**: Best of both worlds

## Cost Comparison

| Method | Images | Time | Cost |
|--------|--------|------|------|
| Scraping (Free APIs) | 50K | 2-4 weeks | $0 |
| Google Dataset | 5M | 1-2 days | $0 |
| Buy Commercial Dataset | 50K | Instant | $10K-$50K |
| Google Vision API | N/A | Ongoing | $18K/year |

## Rate Limits (Free Tier)

| Source | Requests/Hour | Requests/Day |
|--------|---------------|--------------|
| Wikimedia | Unlimited | Unlimited |
| Pexels | 200 | 20,000 |
| Unsplash | 50 | 5,000 |
| Google S3 | Unlimited | Unlimited |

## Pro Tips

### 1. Start with Google Dataset
Download the metadata CSV first, then cherry-pick landmarks you need:
```python
import pandas as pd

df = pd.read_csv('train.csv')
top_landmarks = df['landmark_id'].value_counts().head(1000)
```

### 2. Parallel Downloads
Speed up scraping with multiple threads:
```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=5) as executor:
    executor.map(download_image, urls)
```

### 3. Quality Over Quantity
Better to have 10,000 high-quality images than 50,000 low-quality ones.

## Next Steps

1. **Today**: Get Pexels + Unsplash API keys (5 min)
2. **This Week**: Run scraper, collect 5,000 images
3. **Next Week**: Download Google dataset, filter best images
4. **Month 1**: Train first model on 10,000 images
5. **Month 2**: Scale to 50,000 images, deploy production model

## Support

All sources are 100% free and legal. No premium accounts needed!

**Questions?**
- Pexels API Docs: https://www.pexels.com/api/documentation/
- Unsplash API Docs: https://unsplash.com/documentation
- Wikimedia API Docs: https://www.mediawiki.org/wiki/API
