import json
from pathlib import Path

def prepare_ml_data():
    base_dir = Path(__file__).parent.parent / 'data' / 'daily-collection'
    json_file = base_dir / 'metadata_2025-12-22.json'
    
    with open(json_file, encoding='utf-8') as f:
        data = json.load(f)
    
    # ML training format with GPS
    ml_data = []
    for item in data:
        img_path = f"{item['state'].lower()}/{item['location'].lower().replace(' ', '-')}/{item['filename']}"
        
        ml_data.append({
            'image_path': img_path,
            'gps': [item['latitude'], item['longitude']],
            'location': item['location'],
            'state': item['state'],
            'address': item['address']
        })
    
    # Save for ML training
    output = base_dir.parent / 'ml-training' / 'training_data.json'
    output.parent.mkdir(exist_ok=True)
    
    with open(output, 'w') as f:
        json.dump(ml_data, f, indent=2)
    
    print(f"Created ML training data: {len(ml_data)} samples")
    print(f"Saved to: {output}")
    print(f"\nSample: {ml_data[0]}")

if __name__ == '__main__':
    prepare_ml_data()
