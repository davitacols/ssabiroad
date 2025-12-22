from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import os
import sys

def get_gps_data(image_path):
    try:
        img = Image.open(image_path)
        exif = img._getexif()
        
        if not exif:
            return None
        
        gps_info = {}
        for tag, value in exif.items():
            tag_name = TAGS.get(tag, tag)
            if tag_name == 'GPSInfo':
                for gps_tag in value:
                    gps_tag_name = GPSTAGS.get(gps_tag, gps_tag)
                    gps_info[gps_tag_name] = value[gps_tag]
        
        return gps_info if gps_info else None
    except:
        return None

def check_images(directory, limit=10):
    count = 0
    with_gps = 0
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                if count >= limit:
                    break
                
                path = os.path.join(root, file)
                gps = get_gps_data(path)
                has_gps = gps is not None and len(gps) > 0
                
                print(f"{file}: {'[GPS]' if has_gps else '[NO GPS]'}")
                if has_gps:
                    with_gps += 1
                count += 1
        
        if count >= limit:
            break
    
    print(f"\n{with_gps}/{count} images have GPS tags")

if __name__ == '__main__':
    directory = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'data', 'daily-collection')
    check_images(directory)
