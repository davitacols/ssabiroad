from PIL import Image
import piexif
import json
import os
from pathlib import Path

def to_degrees(value):
    d = int(value)
    m = int((value - d) * 60)
    s = int((value - d - m/60) * 3600 * 100)
    return ((d, 1), (m, 1), (s, 100))

def add_gps_to_image(image_path, lat, lng):
    img = Image.open(image_path)
    exif_dict = piexif.load(img.info.get('exif', b''))
    
    lat_deg = to_degrees(abs(lat))
    lng_deg = to_degrees(abs(lng))
    
    exif_dict['GPS'] = {
        piexif.GPSIFD.GPSLatitude: lat_deg,
        piexif.GPSIFD.GPSLatitudeRef: b'N' if lat >= 0 else b'S',
        piexif.GPSIFD.GPSLongitude: lng_deg,
        piexif.GPSIFD.GPSLongitudeRef: b'E' if lng >= 0 else b'W',
    }
    
    exif_bytes = piexif.dump(exif_dict)
    img.save(image_path, exif=exif_bytes)

def process_metadata(json_path, base_dir):
    with open(json_path) as f:
        data = json.load(f)
    
    processed = 0
    for item in data:
        img_path = Path(base_dir) / item['state'].lower() / item['location'].lower().replace(' ', '-') / item['filename']
        
        if img_path.exists():
            try:
                add_gps_to_image(str(img_path), item['latitude'], item['longitude'])
                processed += 1
                if processed % 100 == 0:
                    print(f"Processed {processed} images...")
            except Exception as e:
                print(f"Error {img_path.name}: {e}")
    
    print(f"Done! Added GPS to {processed}/{len(data)} images")

if __name__ == '__main__':
    base_dir = Path(__file__).parent.parent / 'data' / 'daily-collection'
    json_file = base_dir / 'metadata_2025-12-22.json'
    
    print(f"Adding GPS tags from {json_file.name}...")
    process_metadata(json_file, base_dir)
