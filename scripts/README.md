# GeoVision-10M Dataset Downloader

Automated script to download geotagged images from **Wikimedia Commons** - 100% FREE, no API key needed!

## Setup

```bash
cd scripts
pip install -r requirements.txt
```

## Usage

```bash
python download_datasets.py
```

**That's it!** No API keys, no accounts, completely free.

## What it downloads:

- **Wikimedia Commons geotagged images**
- Default: 10,000 images per run
- All images have GPS coordinates
- Free to use (Creative Commons licenses)
- Diverse global coverage

## Output Structure

```
geovision_data/
└── wikimedia/
    ├── {image_id}.jpg
    └── {image_id}.json (metadata with lat/lon)
```

## Get More Images

Just run the script multiple times:
```bash
python download_datasets.py  # Run 1: 10k images
python download_datasets.py  # Run 2: 10k more images
python download_datasets.py  # Run 3: 10k more images
```

Each run searches different geographic areas for diversity.

## Configuration

Edit `download_datasets.py` to change limit:
```python
images = downloader.search_geotagged(limit=50000)  # 50k images
```

## Advantages

✓ Completely free
✓ No API key required
✓ No rate limits
✓ High-quality images
✓ Verified GPS coordinates
✓ Global coverage
