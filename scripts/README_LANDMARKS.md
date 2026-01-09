# Landmark-Recognition-50K Dataset Builder

Downloads landmark images from Google Landmarks Dataset v2.

## Setup

```bash
cd scripts
pip install -r requirements.txt
```

## Usage

```bash
python download_landmarks.py
```

## What it downloads:

- **Google Landmarks Dataset v2**
- 50,000 landmark images
- Includes landmark IDs and metadata
- High-quality images of famous landmarks worldwide

## Output Structure

```
landmark_data/
├── landmarks_metadata.csv
└── images/
    ├── {image_id}.jpg
    └── {image_id}.json (metadata)
```

## Dataset Info

- **Source**: Google Landmarks Dataset v2
- **License**: Creative Commons BY
- **Size**: 50K images (configurable)
- **Content**: Famous landmarks, monuments, buildings

## Configuration

Edit `download_landmarks.py` to change limit:
```python
landmarks = downloader.parse_metadata(csv_path, limit=100000)  # 100k images
```

## Notes

- Downloads from official Google Landmarks v2 dataset
- Free to use for research
- Includes landmark IDs for classification tasks
- Suitable for landmark recognition model training
