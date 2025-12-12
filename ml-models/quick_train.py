"""Quick training with sample buildings"""
import requests

# Famous buildings with coordinates
buildings = [
    {"name": "Eiffel Tower", "lat": 48.8584, "lon": 2.2945, "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg"},
    {"name": "Statue of Liberty", "lat": 40.6892, "lon": -74.0445, "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/800px-Statue_of_Liberty_7.jpg"},
    {"name": "Big Ben", "lat": 51.5007, "lon": -0.1246, "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg/800px-Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg"},
    {"name": "Taj Mahal", "lat": 27.1751, "lon": 78.0421, "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Taj_Mahal%2C_Agra%2C_India_edit3.jpg/800px-Taj_Mahal%2C_Agra%2C_India_edit3.jpg"},
    {"name": "Sydney Opera House", "lat": -33.8568, "lon": 151.2153, "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_Australia._%2821339175489%29.jpg/800px-Sydney_Australia._%2821339175489%29.jpg"},
]

print("Adding buildings to ML index...")
for b in buildings:
    try:
        # Download image
        img_response = requests.get(b["url"], timeout=10)
        if img_response.status_code != 200:
            print(f"❌ Failed to download {b['name']}")
            continue
        
        # Add to index
        files = {'file': (f"{b['name']}.jpg", img_response.content, 'image/jpeg')}
        data = {'metadata': f'{{"name":"{b["name"]}","latitude":{b["lat"]},"longitude":{b["lon"]}}}'}
        
        response = requests.post('http://localhost:8000/add_to_index', files=files, data=data)
        if response.status_code == 200:
            print(f"✅ Added {b['name']}")
        else:
            print(f"❌ Failed {b['name']}: {response.text}")
    except Exception as e:
        print(f"❌ Error with {b['name']}: {e}")

print("\n✅ Training complete! Test at http://localhost:3000/ml-test")
