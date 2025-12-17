# Data Collection Guide

## 3 Ways to Collect Training Data

### 1. Automatic Collection (Recommended)

Run the automated collector on EC2:

```bash
ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@52.91.173.191
cd /home/ubuntu/ssabiroad/ml-models
source venv/bin/activate

# Set API key
export GOOGLE_MAPS_API_KEY="your-key"

# Run collector
python training/auto_collect.py
```

This collects:
- Google Street View images (Nigerian cities)
- OpenStreetMap building data
- User-uploaded images from database

### 2. User Contributions

Users automatically contribute when they:
- Upload building photos
- Use the detection feature
- Correct predictions (active learning)

Data is automatically sent to ML API via `/api/ml/collect`

### 3. Manual Upload

Upload images directly to EC2:

```bash
# From Windows
scp -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" -r your-images/* ubuntu@52.91.173.191:/home/ubuntu/ssabiroad/ml-models/data/geolocations/train/
```

## Data Structure

```
data/
├── geolocations/
│   ├── train/
│   │   ├── lagos/
│   │   ├── abuja/
│   │   └── kano/
│   └── val/
├── landmarks/
│   ├── train/
│   └── val/
└── streetview/
```

## Minimum Data Requirements

- **Geolocation Model**: 1000+ images (200 per city)
- **Landmark Model**: 500+ images (50 per landmark)

## Check Data Status

```bash
# On EC2
cd /home/ubuntu/ssabiroad/ml-models
find data -type f -name "*.jpg" | wc -l
```

## Schedule Automatic Collection

Add to crontab on EC2:

```bash
# Run daily at 2 AM
0 2 * * * cd /home/ubuntu/ssabiroad/ml-models && source venv/bin/activate && python training/auto_collect.py
```

## Monitor Collection

Check logs:
```bash
tail -f /home/ubuntu/ssabiroad/ml-models/logs/collection.log
```

## Next Steps

After collecting data:
1. Verify data quality
2. Run training from `/admin/ml-training`
3. Monitor model performance
